"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { getSession } from "next-auth/react";
import {
  resendCheckoutAccountOtpAction,
  startCheckoutAccountVerificationAction,
  verifyCheckoutAccountOtpAction,
} from "@/app/(auth)/register/actions";
import { placeCheckoutOrderAction } from "@/app/(shop)/actions";
import { IconX } from "@/components/icons";
import {
  guestAuthDialogHeadingClass,
  guestAuthDialogSubtitleClass,
  guestAuthFormClass,
  submitClass,
} from "@/components/store/account-popover-styles";
import { useStoreCartVoucher } from "@/components/store/use-store-cart-voucher";
import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { FormInputField } from "@/components/ui/form-input-field";
import { Modal } from "@/components/ui/modal";
import { PasswordInputField } from "@/components/ui/password-input-field";
import {
  STORE_CART_UPDATED_EVENT,
  clearStoreCart,
  readStoreCart,
  type StoreCartItem,
} from "@/lib/cart/store-cart";
import { readStoreVoucherCode } from "@/lib/cart/store-voucher";
import {
  SITE_PRODUCT_SLIDER,
  SITE_ROUTES,
  STORE_SHELL,
} from "@/lib/config/site-config";
import {
  CHECKOUT_PAYMENT_OPTIONS,
  type CheckoutPaymentMethod,
  checkoutToDbPaymentMethod,
  paymentMethodDescription,
} from "@/lib/orders/payment-method";
import { formatProductPriceWithPrefix } from "@/lib/products/format-price";
import { checkoutBillingFieldsSchema } from "@/lib/validation/checkout-billing-schema";

type BillingFormState = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
};

type BillingFieldErrors = Partial<Record<keyof BillingFormState, string>>;

const BILLING_FIELD_ORDER: (keyof BillingFormState)[] = [
  "firstName",
  "lastName",
  "phone",
  "email",
  "address",
  "city",
  "country",
];

const buildBillingFieldErrors = (
  billing: BillingFormState,
): BillingFieldErrors => {
  const parsed = checkoutBillingFieldsSchema.safeParse(billing);
  if (parsed.success) return {};
  const out: BillingFieldErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if (
      key === "firstName" ||
      key === "lastName" ||
      key === "phone" ||
      key === "email" ||
      key === "address" ||
      key === "city" ||
      key === "country"
    ) {
      if (!out[key]) out[key] = issue.message;
    }
  }
  return out;
};

const scrollToFirstBillingError = (errs: BillingFieldErrors) => {
  const firstKey = BILLING_FIELD_ORDER.find((k) => errs[k]);
  if (!firstKey) return;
  requestAnimationFrame(() => {
    document.getElementById(firstKey)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  });
};

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<StoreCartItem[]>([]);
  const [paymentMethod, setPaymentMethod] =
    useState<CheckoutPaymentMethod>("cod");
  const [createAccount, setCreateAccount] = useState(false);
  const [accountPassword, setAccountPassword] = useState("");
  const [accountConfirmPassword, setAccountConfirmPassword] = useState("");
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isVerifyingOtp, startVerifyingOtp] = useTransition();
  const [isResendingOtp, startResendingOtp] = useTransition();
  const [otpMessage, setOtpMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPlacingOrder, startPlacingOrder] = useTransition();
  const [orderMessage, setOrderMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [billingFieldErrors, setBillingFieldErrors] =
    useState<BillingFieldErrors>({});
  const [billingForm, setBillingForm] = useState<BillingFormState>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    country: "Pakistan",
  });

  useEffect(() => {
    const sync = () => setItems(readStoreCart());
    sync();
    window.addEventListener(STORE_CART_UPDATED_EVENT, sync);
    return () => window.removeEventListener(STORE_CART_UPDATED_EVENT, sync);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const hydrateFromSession = async () => {
      const session = await getSession();
      if (isCancelled) return;

      const signedIn = Boolean(session?.user?.id);
      setIsLoggedIn(signedIn);
      if (signedIn) {
        const firstName = session?.user?.firstName?.trim() ?? "";
        const lastName = session?.user?.lastName?.trim() ?? "";
        const email = session?.user?.email?.trim() ?? "";
        const phone = session?.user?.phone?.trim() ?? "";
        setBillingForm((prev) => ({
          ...prev,
          firstName: prev.firstName || firstName,
          lastName: prev.lastName || lastName,
          email: prev.email || email,
          phone: prev.phone || phone,
          country: prev.country || "Pakistan",
        }));
      }
      setIsAuthResolved(true);
    };
    void hydrateFromSession();

    return () => {
      isCancelled = true;
    };
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items],
  );
  const originalSubtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + (item.originalUnitPrice ?? item.unitPrice) * item.quantity,
        0,
      ),
    [items],
  );
  const discountAmount = Math.max(0, originalSubtotal - subtotal);
  const shippingCharges = 0;

  const {
    discountVoucher,
    setDiscountVoucher,
    voucherPreview,
    voucherMessage,
    isVoucherPending,
    handleApplyVoucher,
    handleRemoveVoucher,
    voucherSavings,
  } = useStoreCartVoucher({
    cartNetSubtotal: subtotal,
    applySuccessVariant: "checkout",
  });

  const orderTotal = Math.max(0, subtotal - voucherSavings) + shippingCharges;

  const checkoutRows = [
    {
      label: "First Name",
      name: "firstName",
      required: true,
      autoComplete: "given-name",
    },
    {
      label: "Last Name",
      name: "lastName",
      required: true,
      autoComplete: "family-name",
    },
    { label: "Phone", name: "phone", required: true, autoComplete: "tel" },
    {
      label: "Email Address",
      name: "email",
      required: true,
      autoComplete: "email",
    },
    {
      label: "Address",
      name: "address",
      required: true,
      autoComplete: "street-address",
    },
    {
      label: "City",
      name: "city",
      required: true,
      autoComplete: "address-level2",
    },
    {
      label: "Country",
      name: "country",
      required: true,
      autoComplete: "country-name",
    },
  ] as const;

  const handleBillingFieldChange = (
    field: keyof BillingFormState,
    value: string,
  ) => {
    setOrderMessage(null);
    setBillingFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setBillingForm((prev) => ({ ...prev, [field]: value }));
  };
  const paymentRadioInputClass =
    "sr-only focus-visible:outline-none enabled:focus-visible:ring-2 enabled:focus-visible:ring-[var(--store-brand-accent)] enabled:focus-visible:ring-offset-2";

  const handlePlaceOrder = () => {
    const billingErrors = buildBillingFieldErrors(billingForm);
    if (Object.keys(billingErrors).length > 0) {
      setBillingFieldErrors(billingErrors);
      setOrderMessage({
        type: "error",
        text: "Please complete all required billing fields.",
      });
      scrollToFirstBillingError(billingErrors);
      return;
    }
    setBillingFieldErrors({});

    if (createAccount && !isLoggedIn) {
      startPlacingOrder(async () => {
        const startResult = await startCheckoutAccountVerificationAction({
          firstName: billingForm.firstName,
          lastName: billingForm.lastName,
          email: billingForm.email,
          phone: billingForm.phone,
          address: billingForm.address,
          city: billingForm.city,
          country: billingForm.country,
          password: accountPassword,
          confirmPassword: accountConfirmPassword,
        });

        if (!startResult.ok) {
          setOrderMessage({ type: "error", text: startResult.error });
          return;
        }

        setOtpCode("");
        setOtpMessage(null);
        setPendingVerificationEmail(startResult.pendingEmail);
        setIsOtpModalOpen(true);
        setOrderMessage({
          type: "success",
          text: "Verification code sent. Enter OTP to complete account creation and place your order.",
        });
      });
      return;
    }

    const placeOrderNow = async () => {
      const result = await placeCheckoutOrderAction({
        createAccount: false,
        ...billingForm,
        paymentMethod,
        voucherCode: readStoreVoucherCode() ?? undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          selectedColor: item.selectedColor,
          selectedStorage: item.selectedStorage,
        })),
      });

      if (!result.ok) {
        setOrderMessage({ type: "error", text: result.error });
        return;
      }

      clearStoreCart();
      setItems([]);
      router.refresh();
      router.push(`/order-received/${result.orderId}`);
    };

    startPlacingOrder(async () => {
      await placeOrderNow();
    });
  };

  const handleVerifyOtpAndPlaceOrder = () => {
    startVerifyingOtp(async () => {
      const verify = await verifyCheckoutAccountOtpAction(
        pendingVerificationEmail,
        otpCode,
      );
      if (!verify.ok) {
        setOtpMessage({ type: "error", text: verify.error });
        return;
      }

      const otpBillingErrors = buildBillingFieldErrors(billingForm);
      if (Object.keys(otpBillingErrors).length > 0) {
        setIsOtpModalOpen(false);
        setBillingFieldErrors(otpBillingErrors);
        setOtpMessage(null);
        setOrderMessage({
          type: "error",
          text: "Please complete all required billing fields before we place your order.",
        });
        scrollToFirstBillingError(otpBillingErrors);
        return;
      }
      setBillingFieldErrors({});

      setIsOtpModalOpen(false);
      setOtpMessage(null);
      setOrderMessage({
        type: "success",
        text: "Account verified successfully. Placing your order...",
      });

      const result = await placeCheckoutOrderAction({
        createAccount: true,
        ...billingForm,
        paymentMethod,
        voucherCode: readStoreVoucherCode() ?? undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          selectedColor: item.selectedColor,
          selectedStorage: item.selectedStorage,
        })),
      });

      if (!result.ok) {
        setOrderMessage({ type: "error", text: result.error });
        return;
      }

      clearStoreCart();
      setItems([]);
      setCreateAccount(false);
      setAccountPassword("");
      setAccountConfirmPassword("");
      router.refresh();
      router.push(`/order-received/${result.orderId}`);
    });
  };

  return (
    <main className={`flex-1 py-8 sm:py-10 ${STORE_SHELL}`}>
      <header className="mb-7 flex items-end justify-between gap-3 sm:mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Checkout
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            {items.length === 0
              ? "Your cart is empty."
              : `${items.length} ${items.length === 1 ? "item" : "items"} ready for order placement.`}
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_28rem]">
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          {isAuthResolved && !isLoggedIn ? (
            <p className="text-sm text-neutral-600">
              Returning customer?{" "}
              <Link
                href={SITE_ROUTES.login}
                className="font-semibold text-[var(--store-brand-primary)] hover:underline"
              >
                Click here to login
              </Link>
            </p>
          ) : null}

          <h1 className="mt-6 text-3xl font-bold tracking-tight text-neutral-900">
            Billing Details
          </h1>

          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {checkoutRows.slice(0, 2).map((field) => (
                <FormInputField
                  key={field.name}
                  id={field.name}
                  label={`${field.label}${field.required ? " *" : ""}`}
                  name={field.name}
                  required={field.required}
                  autoComplete={field.autoComplete}
                  value={billingForm[field.name]}
                  errorText={billingFieldErrors[field.name]}
                  onChange={(event) =>
                    handleBillingFieldChange(
                      field.name,
                      event.currentTarget.value,
                    )
                  }
                />
              ))}
            </div>

            {checkoutRows.slice(2).map((field) => (
              <FormInputField
                key={field.name}
                id={field.name}
                label={`${field.label}${field.required ? " *" : ""}`}
                name={field.name}
                required={field.required}
                autoComplete={field.autoComplete}
                value={billingForm[field.name]}
                errorText={billingFieldErrors[field.name]}
                onChange={(event) =>
                  handleBillingFieldChange(
                    field.name,
                    event.currentTarget.value,
                  )
                }
              />
            ))}

            {!isLoggedIn ? (
              <>
                <CheckboxField
                  label="Create an account?"
                  className="pt-1"
                  checked={createAccount}
                  onChange={(event) =>
                    setCreateAccount(event.currentTarget.checked)
                  }
                />
                {createAccount ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <PasswordInputField
                      label="Set password"
                      name="accountPassword"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      value={accountPassword}
                      onChange={(event) =>
                        setAccountPassword(event.currentTarget.value)
                      }
                    />
                    <PasswordInputField
                      label="Confirm password"
                      name="accountConfirmPassword"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      value={accountConfirmPassword}
                      onChange={(event) =>
                        setAccountConfirmPassword(event.currentTarget.value)
                      }
                    />
                  </div>
                ) : null}
              </>
            ) : null}
          </form>
        </section>

        <aside className="h-fit rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <div className="border-b border-neutral-200 pb-4">
            <h2 className="text-lg font-semibold text-neutral-900">
              Order Summary
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Review your total before checkout.
            </p>
          </div>

          <div className="space-y-3 py-4">
            {items.length === 0 ? (
              <p className="text-sm text-neutral-500">Your cart is empty.</p>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.productId}-${item.selectedColor ?? ""}-${item.selectedStorage ?? ""}`}
                  className="grid grid-cols-[1fr_auto] gap-3 text-sm text-neutral-700"
                >
                  <p className="text-neutral-700">
                    {item.name}{" "}
                    <span className="font-semibold text-neutral-500">
                      x {item.quantity}
                    </span>
                  </p>
                  <p className="font-semibold text-neutral-900">
                    {formatProductPriceWithPrefix(
                      item.unitPrice * item.quantity,
                      SITE_PRODUCT_SLIDER.pricePrefix,
                    )}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="space-y-3 border-t border-neutral-200 py-4 text-sm">
            <div className="flex items-center justify-between text-neutral-700">
              <span>Subtotal</span>
              <span className="font-semibold text-neutral-900">
                {formatProductPriceWithPrefix(
                  originalSubtotal,
                  SITE_PRODUCT_SLIDER.pricePrefix,
                )}
              </span>
            </div>
            <div className="flex items-center justify-between text-neutral-700">
              <span>Discount</span>
              <span className="font-semibold text-emerald-700">
                -{" "}
                {formatProductPriceWithPrefix(
                  discountAmount,
                  SITE_PRODUCT_SLIDER.pricePrefix,
                )}
              </span>
            </div>
            {voucherPreview ? (
              <div className="flex items-center justify-between text-neutral-700">
                <span>
                  Voucher{" "}
                  <span className="font-mono text-xs text-neutral-500">
                    ({voucherPreview.code})
                  </span>
                </span>
                <span className="font-semibold text-emerald-700">
                  -{" "}
                  {formatProductPriceWithPrefix(
                    voucherPreview.amount,
                    SITE_PRODUCT_SLIDER.pricePrefix,
                  )}
                </span>
              </div>
            ) : null}
            <div className="flex items-center justify-between text-neutral-700">
              <span>Shipping</span>
              <span className="font-semibold text-neutral-900">Free</span>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex w-full max-w-xs items-center gap-2 self-center">
                <div className="relative min-w-0 flex-1">
                  <FormInputField
                    label="Insert Voucher"
                    name="discountVoucher"
                    value={discountVoucher}
                    onChange={(event) =>
                      setDiscountVoucher(event.currentTarget.value)
                    }
                    wrapperClassName="min-w-0"
                    inputClassName="peer h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 pb-1 pr-9 pt-3 text-sm leading-5 text-neutral-900 outline-none ring-0 transition-colors placeholder:text-transparent focus:border-[var(--store-brand-primary)] focus:ring-0"
                    labelClassName="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 bg-white px-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500 transition-all duration-150 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[10px] peer-focus:text-[var(--store-brand-primary)] peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-neutral-600"
                  />
                  {voucherPreview || discountVoucher.trim().length > 0 ? (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 z-[2] -translate-y-1/2 rounded p-0.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
                      aria-label={
                        voucherPreview ? "Remove voucher" : "Clear voucher code"
                      }
                      onClick={handleRemoveVoucher}
                    >
                      <IconX width={16} height={16} />
                    </button>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className="h-10 shrink-0 rounded-lg px-4"
                  disabled={isVoucherPending}
                  isLoading={isVoucherPending}
                  loadingLabel="Applying…"
                  onClick={handleApplyVoucher}
                >
                  Apply
                </Button>
              </div>
              {voucherMessage ? (
                <p
                  className={`text-center text-xs ${
                    voucherMessage.type === "success"
                      ? "text-emerald-700"
                      : "text-red-600"
                  }`}
                  role={voucherMessage.type === "error" ? "alert" : "status"}
                >
                  {voucherMessage.text}
                </p>
              ) : null}
            </div>
          </div>

          <div className="border-t border-neutral-200 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-700">Total</p>
              <p className="text-xl font-bold text-[var(--store-brand-primary)]">
                {formatProductPriceWithPrefix(
                  orderTotal,
                  SITE_PRODUCT_SLIDER.pricePrefix,
                )}
              </p>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              Taxes calculated at checkout.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {CHECKOUT_PAYMENT_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="group flex items-start gap-2.5 text-neutral-700"
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === option.value}
                  onChange={() => setPaymentMethod(option.value)}
                  className={paymentRadioInputClass}
                />
                <span
                  aria-hidden
                  className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-[var(--store-brand-accent)] bg-white transition-colors group-has-[:checked]:bg-[var(--store-brand-accent)]"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white opacity-0 transition-opacity group-has-[:checked]:opacity-100" />
                </span>
                <span>{option.label}</span>
              </label>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-neutral-50 p-3 text-sm text-neutral-600">
            {paymentMethodDescription(checkoutToDbPaymentMethod(paymentMethod))}
          </div>

          {orderMessage ? (
            <p
              className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
                orderMessage.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
              role={orderMessage.type === "error" ? "alert" : "status"}
            >
              {orderMessage.text}
            </p>
          ) : null}

          <Button
            type="button"
            variant="accent"
            size="md"
            className="mt-5 w-full rounded-full"
            disabled={isPlacingOrder || items.length === 0}
            isLoading={isPlacingOrder}
            loadingLabel="Placing order..."
            onClick={handlePlaceOrder}
          >
            Place Order
          </Button>

          <Link href={SITE_ROUTES.cart} className="mt-2 block">
            <Button
              type="button"
              variant="primary"
              size="md"
              fullWidth
              className="rounded-full"
            >
              Back to cart
            </Button>
          </Link>
        </aside>
      </div>
      <Modal
        isOpen={isOtpModalOpen}
        onClose={() => {
          if (isVerifyingOtp || isResendingOtp) return;
          setIsOtpModalOpen(false);
        }}
        title="Check your email"
        description={`Enter the 6-digit code we sent to ${pendingVerificationEmail}.`}
      >
        <div>
          <h3 className={guestAuthDialogHeadingClass}>Check your email</h3>
          <p className={guestAuthDialogSubtitleClass}>
            Enter the 6-digit code we sent to{" "}
            <span className="font-medium text-neutral-800">
              {pendingVerificationEmail}
            </span>
            .
          </p>
          {otpMessage ? (
            <p
              className={`mt-4 rounded-lg border px-3 py-2 text-center text-sm ${
                otpMessage.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {otpMessage.text}
            </p>
          ) : null}
          <div className={guestAuthFormClass}>
            <FormInputField
              label="Verification code"
              name="checkoutOtpCode"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              required
              placeholder="000000"
              value={otpCode}
              onChange={(event) => {
                setOtpMessage(null);
                setOtpCode(
                  event.currentTarget.value.replace(/\D/g, "").slice(0, 6),
                );
              }}
            />
            <button
              type="button"
              className={submitClass}
              onClick={handleVerifyOtpAndPlaceOrder}
              disabled={isVerifyingOtp || otpCode.length !== 6}
            >
              {isVerifyingOtp ? "Verifying…" : "Verify & Place"}
            </button>
          </div>
          <div className="mt-3">
            <button
              type="button"
              className={submitClass}
              disabled={isResendingOtp}
              onClick={() =>
                startResendingOtp(async () => {
                  const resend = await resendCheckoutAccountOtpAction(
                    pendingVerificationEmail,
                  );
                  setOtpMessage(
                    resend.ok
                      ? { type: "success", text: "A new OTP has been sent." }
                      : { type: "error", text: resend.error },
                  );
                })
              }
            >
              {isResendingOtp ? "Sending…" : "Resend Code"}
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
