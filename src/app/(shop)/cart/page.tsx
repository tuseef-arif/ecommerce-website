"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { IconX } from "@/components/icons";
import { ProductImageWithFallback } from "@/components/store/product-image-with-fallback";
import { Button } from "@/components/ui/button";
import { FormInputField } from "@/components/ui/form-input-field";
import {
  STORE_SHELL,
  SITE_PRODUCT_SLIDER,
  SITE_ROUTES,
} from "@/lib/config/site-config";
import {
  STORE_CART_UPDATED_EVENT,
  getStoreCartItemMaxQuantity,
  readStoreCart,
  removeItemFromStoreCart,
  setStoreCartItemQuantity,
  type StoreCartItem,
} from "@/lib/cart/store-cart";
import { formatProductPriceWithPrefix } from "@/lib/products/format-price";

export default function CartPage() {
  const [items, setItems] = useState<StoreCartItem[]>([]);
  const [discountVoucher, setDiscountVoucher] = useState("");

  useEffect(() => {
    const sync = () => setItems(readStoreCart());
    sync();
    window.addEventListener(STORE_CART_UPDATED_EVENT, sync);
    return () => window.removeEventListener(STORE_CART_UPDATED_EVENT, sync);
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

  const getItemKey = (item: StoreCartItem) =>
    `${item.productId}-${item.selectedColor ?? ""}-${item.selectedStorage ?? ""}`;

  const getItemIdentifier = (item: StoreCartItem) => ({
    productId: item.productId,
    selectedColor: item.selectedColor,
    selectedStorage: item.selectedStorage,
  });

  const handleQuantityStep = (
    item: StoreCartItem,
    direction: "increase" | "decrease",
  ) => {
    const max = getStoreCartItemMaxQuantity(getItemIdentifier(item), items);
    const nextQuantity =
      direction === "increase"
        ? Math.min(item.quantity + 1, max)
        : Math.max(item.quantity - 1, 1);
    setStoreCartItemQuantity(getItemIdentifier(item), nextQuantity);
  };

  const shippingLabel = subtotal >= 100 ? "Free" : "Calculated at checkout";

  return (
    <main className={`flex-1 py-8 sm:py-10 ${STORE_SHELL}`}>
      <header className="mb-7 flex items-end justify-between gap-3 sm:mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Your Cart
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            {items.length === 0
              ? "Your cart is empty."
              : `${items.length} ${items.length === 1 ? "item" : "items"} ready for checkout.`}
          </p>
        </div>
      </header>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-10 text-center shadow-sm">
          <p className="text-base text-neutral-600">
            Your cart is feeling a little light! 🛒 <br></br>Let’s fix
            that—check out our latest arrivals and find something you love.
          </p>
          <Link href="/products" className="mt-5 inline-flex">
            <Button
              type="button"
              variant="primary"
              size="md"
              className="rounded-full px-6"
            >
              Continue shopping
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="space-y-4">
            {items.map((item) => {
              const originalUnitPrice =
                item.originalUnitPrice ?? item.unitPrice;
              const hasItemDiscount = originalUnitPrice > item.unitPrice;
              const lineOriginalTotal = originalUnitPrice * item.quantity;
              const lineFinalTotal = item.unitPrice * item.quantity;

              return (
                <article
                  key={getItemKey(item)}
                  className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
                >
                  <div className="flex gap-3 sm:gap-4">
                    <Link
                      href={item.href}
                      className="block h-20 w-20 shrink-0 rounded-xl bg-neutral-50 sm:h-24 sm:w-24"
                    >
                      <ProductImageWithFallback
                        src={item.imagePath}
                        alt={item.name}
                        className="h-full w-full rounded-xl border border-neutral-100 bg-neutral-50 object-contain p-2"
                      />
                    </Link>
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={item.href}
                            className="line-clamp-2 text-base font-semibold leading-tight text-neutral-900 transition-colors hover:text-[var(--store-brand-primary)] sm:text-lg"
                          >
                            {item.name}
                          </Link>
                          {item.selectedColor || item.selectedStorage ? (
                            <p className="mt-1 text-xs text-neutral-600 sm:text-sm">
                              {item.selectedColor
                                ? `Color: ${item.selectedColor}`
                                : ""}
                              {item.selectedColor && item.selectedStorage
                                ? " · "
                                : ""}
                              {item.selectedStorage
                                ? `Storage: ${item.selectedStorage}`
                                : ""}
                            </p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            removeItemFromStoreCart(getItemIdentifier(item))
                          }
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
                          aria-label={`Remove ${item.name}`}
                        >
                          <IconX width={16} height={16} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 sm:gap-3">
                        <div className="min-w-0 text-xs font-medium text-neutral-600 sm:text-sm">
                          <span>Unit: </span>
                          {hasItemDiscount ? (
                            <span className="inline-flex items-center gap-1 whitespace-nowrap sm:gap-2">
                              <span className="text-[11px] text-neutral-400 line-through sm:text-sm">
                                {formatProductPriceWithPrefix(
                                  originalUnitPrice,
                                  SITE_PRODUCT_SLIDER.pricePrefix,
                                )}
                              </span>
                              <span className="font-semibold text-neutral-900 whitespace-nowrap">
                                {formatProductPriceWithPrefix(
                                  item.unitPrice,
                                  SITE_PRODUCT_SLIDER.pricePrefix,
                                )}
                              </span>
                            </span>
                          ) : (
                            <span className="font-semibold text-neutral-900 whitespace-nowrap">
                              {formatProductPriceWithPrefix(
                                item.unitPrice,
                                SITE_PRODUCT_SLIDER.pricePrefix,
                              )}
                            </span>
                          )}
                        </div>

                        <div className="inline-flex shrink-0 items-center rounded-full border border-neutral-200 bg-neutral-50 p-1">
                          <button
                            type="button"
                            onClick={() => handleQuantityStep(item, "decrease")}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-lg leading-none text-neutral-700 transition-colors hover:bg-white"
                            aria-label={`Decrease quantity for ${item.name}`}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={getStoreCartItemMaxQuantity(
                              getItemIdentifier(item),
                              items,
                            )}
                            value={item.quantity}
                            onChange={(event) =>
                              setStoreCartItemQuantity(
                                getItemIdentifier(item),
                                Number(event.currentTarget.value),
                              )
                            }
                            className="h-8 w-12 appearance-none border-0 bg-transparent px-1 text-center text-sm font-semibold text-neutral-900 outline-none [appearance:textfield] focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            aria-label={`Quantity for ${item.name}`}
                          />
                          <button
                            type="button"
                            onClick={() => handleQuantityStep(item, "increase")}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-lg leading-none text-neutral-700 transition-colors hover:bg-white"
                            aria-label={`Increase quantity for ${item.name}`}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-dashed border-neutral-200 pt-3">
                        <p className="text-xs uppercase tracking-wide text-neutral-500">
                          Total
                        </p>
                        <div className="inline-flex items-center gap-2">
                          {hasItemDiscount ? (
                            <span className="text-xs text-neutral-400 line-through sm:text-sm">
                              {formatProductPriceWithPrefix(
                                lineOriginalTotal,
                                SITE_PRODUCT_SLIDER.pricePrefix,
                              )}
                            </span>
                          ) : null}
                          <p className="text-base font-bold text-neutral-900 sm:text-lg">
                            {formatProductPriceWithPrefix(
                              lineFinalTotal,
                              SITE_PRODUCT_SLIDER.pricePrefix,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
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

            <div className="space-y-3 py-4 text-sm">
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
              <div className="flex items-center justify-between text-neutral-700">
                <span>Shipping</span>
                <span className="font-semibold text-neutral-900">
                  {shippingLabel}
                </span>
              </div>
              <div className="flex justify-center pt-1">
                <div className="flex w-full max-w-xs items-center gap-2">
                  <FormInputField
                    label="Insert Voucher"
                    name="discountVoucher"
                    value={discountVoucher}
                    onChange={(event) =>
                      setDiscountVoucher(event.currentTarget.value)
                    }
                    wrapperClassName="min-w-0 flex-1"
                    inputClassName="peer h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 pb-1 pt-3 text-sm leading-5 text-neutral-900 outline-none ring-0 transition-colors placeholder:text-transparent focus:border-[var(--store-brand-primary)] focus:ring-0"
                    labelClassName="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 bg-white px-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500 transition-all duration-150 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[10px] peer-focus:text-[var(--store-brand-primary)] peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-neutral-600"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    className="h-10 rounded-lg px-4"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-200 pt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-neutral-700">Total</p>
                <p className="text-xl font-bold text-[var(--store-brand-primary)]">
                  {formatProductPriceWithPrefix(
                    subtotal,
                    SITE_PRODUCT_SLIDER.pricePrefix,
                  )}
                </p>
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                Taxes calculated at checkout.
              </p>
            </div>

            <Link href={SITE_ROUTES.checkout} className="mt-5 block">
              <Button
                type="button"
                variant="accent"
                size="md"
                fullWidth
                className="rounded-full"
              >
                Checkout
              </Button>
            </Link>

            <Link href="/products" className="mt-2 block">
              <Button
                type="button"
                variant="primary"
                size="md"
                fullWidth
                className="rounded-full"
              >
                Continue shopping
              </Button>
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}
