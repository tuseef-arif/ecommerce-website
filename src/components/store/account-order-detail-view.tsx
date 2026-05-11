import Link from "next/link";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { ProductImageWithFallback } from "@/components/store/product-image-with-fallback";
import { Button } from "@/components/ui/button";
import { SITE_PRODUCT_SLIDER, SITE_ROUTES } from "@/lib/config/site-config";
import { formatInstantForStoreDate } from "@/lib/datetime/display-timezone";
import type { AccountOrderDetail } from "@/lib/orders/account-orders";
import { formatStoreOrderNumber } from "@/lib/orders/account-orders";
import {
  paymentMethodDescription,
  paymentMethodLabel,
} from "@/lib/orders/payment-method";
import { formatProductPriceWithPrefix } from "@/lib/products/format-price";

type AccountOrderDetailViewProps = {
  order: AccountOrderDetail;
};

const displayOrDash = (value: string | null | undefined): string => {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : "—";
};

export const AccountOrderDetailView = ({
  order,
}: AccountOrderDetailViewProps) => {
  const orderNumber = formatStoreOrderNumber(order.id);
  const orderDate = formatInstantForStoreDate(order.createdAt);
  const shippingLabel = "Free";
  const voucherAmount = Number(order.voucherDiscountAmount);
  const fullName =
    `${order.user.firstName ?? ""} ${order.user.lastName ?? ""}`.trim() || "—";
  const paymentLabel = paymentMethodLabel(order.paymentMethod);
  const paymentBlurb = paymentMethodDescription(order.paymentMethod);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_28rem]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500">
                Order {orderNumber}
              </p>
              <p className="mt-1 text-sm text-neutral-600">{orderDate}</p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          <div className="mt-6 grid gap-3 border-y border-neutral-200 py-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500">
                Payment
              </p>
              <p className="mt-1 text-sm font-semibold text-neutral-900">
                {paymentLabel}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500">
                Items
              </p>
              <p className="mt-1 text-sm font-semibold text-neutral-900">
                {order.items.length}{" "}
                {order.items.length === 1 ? "line" : "lines"}
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm text-neutral-700">{paymentBlurb}</p>

          <h2 className="mt-8 text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
            Items
          </h2>

          <div className="mt-4 space-y-4">
            {order.items.map((item) => {
              const colorDelta = Number(item.colorPriceDelta);
              const storageDelta = Number(item.storagePriceDelta);
              const originalUnit =
                Number(item.unitPrice) +
                (Number.isFinite(colorDelta) ? colorDelta : 0) +
                (Number.isFinite(storageDelta) ? storageDelta : 0);
              const unit =
                Number(item.discountedPrice) +
                (Number.isFinite(colorDelta) ? colorDelta : 0) +
                (Number.isFinite(storageDelta) ? storageDelta : 0);
              const hasDiscount = originalUnit > unit + 1e-6;
              const href = `/products/${item.product.slug}`;
              const canLink = item.product.isActive;

              const title = (
                <span className="line-clamp-2 text-base font-semibold leading-tight text-neutral-900 sm:text-lg">
                  {item.productName}
                </span>
              );

              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5"
                >
                  <div className="flex gap-3 sm:gap-4">
                    {canLink ? (
                      <Link
                        href={href}
                        className="block h-20 w-20 shrink-0 rounded-xl bg-neutral-50 sm:h-24 sm:w-24"
                      >
                        <ProductImageWithFallback
                          src={item.product.imagePath}
                          alt={item.productName}
                          className="h-full w-full rounded-xl border border-neutral-100 bg-neutral-50 object-contain p-2"
                        />
                      </Link>
                    ) : (
                      <div className="h-20 w-20 shrink-0 rounded-xl bg-neutral-50 sm:h-24 sm:w-24">
                        <ProductImageWithFallback
                          src={item.product.imagePath}
                          alt={item.productName}
                          className="h-full w-full rounded-xl border border-neutral-100 bg-neutral-50 object-contain p-2"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {canLink ? (
                            <Link
                              href={href}
                              className="block transition-colors hover:text-[var(--store-brand-primary)]"
                            >
                              {title}
                            </Link>
                          ) : (
                            title
                          )}
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
                          {!item.product.isActive ? (
                            <p className="mt-1 text-xs text-neutral-500">
                              This product is no longer listed in the store.
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-neutral-600 sm:text-sm">
                        <span>
                          Qty{" "}
                          <span className="font-semibold text-neutral-900">
                            {item.quantity}
                          </span>
                        </span>
                        <span className="whitespace-nowrap">
                          Unit:{" "}
                          {hasDiscount ? (
                            <span className="inline-flex items-center gap-1 sm:gap-2">
                              <span className="text-[11px] text-neutral-400 line-through sm:text-sm">
                                {formatProductPriceWithPrefix(
                                  originalUnit,
                                  SITE_PRODUCT_SLIDER.pricePrefix,
                                )}
                              </span>
                              <span className="font-semibold text-neutral-900">
                                {formatProductPriceWithPrefix(
                                  unit,
                                  SITE_PRODUCT_SLIDER.pricePrefix,
                                )}
                              </span>
                            </span>
                          ) : (
                            <span className="font-semibold text-neutral-900">
                              {formatProductPriceWithPrefix(
                                unit,
                                SITE_PRODUCT_SLIDER.pricePrefix,
                              )}
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t border-dashed border-neutral-200 pt-3">
                        <p className="text-xs uppercase tracking-wide text-neutral-500">
                          Line total
                        </p>
                        <p className="text-base font-bold text-neutral-900 sm:text-lg">
                          {formatProductPriceWithPrefix(
                            Number(item.lineTotal),
                            SITE_PRODUCT_SLIDER.pricePrefix,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-semibold text-neutral-900">
            Shipping details
          </h3>
          <div className="mt-3 space-y-1 text-sm text-neutral-700">
            <p>{fullName}</p>
            <p>{displayOrDash(order.user.address)}</p>
            <p>
              {displayOrDash(order.user.city)},{" "}
              {displayOrDash(order.user.country)}
            </p>
            <p>{displayOrDash(order.user.phone)}</p>
            <p>{displayOrDash(order.user.email)}</p>
          </div>
        </section>
      </div>

      <aside className="h-fit rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
        <div className="border-b border-neutral-200 pb-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            Order summary
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Review-only — totals are shown as placed.
          </p>
        </div>

        <div className="space-y-3 border-b border-neutral-200 py-4 text-sm">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_auto] gap-3 text-neutral-700"
            >
              <p className="min-w-0 text-neutral-700">
                <span className="line-clamp-2">{item.productName}</span>{" "}
                <span className="font-semibold text-neutral-500">
                  × {item.quantity}
                </span>
              </p>
              <p className="shrink-0 font-semibold text-neutral-900">
                {formatProductPriceWithPrefix(
                  Number(item.lineTotal),
                  SITE_PRODUCT_SLIDER.pricePrefix,
                )}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-3 py-4 text-sm">
          <div className="flex items-center justify-between text-neutral-700">
            <span>Subtotal</span>
            <span className="font-semibold text-neutral-900">
              {formatProductPriceWithPrefix(
                Number(order.subtotal),
                SITE_PRODUCT_SLIDER.pricePrefix,
              )}
            </span>
          </div>
          <div className="flex items-center justify-between text-neutral-700">
            <span>Catalog savings</span>
            <span className="font-semibold text-emerald-700">
              -{" "}
              {formatProductPriceWithPrefix(
                Number(order.discountAmount),
                SITE_PRODUCT_SLIDER.pricePrefix,
              )}
            </span>
          </div>
          {voucherAmount > 0 ? (
            <div className="flex items-center justify-between text-neutral-700">
              <span>
                Voucher
                {order.voucherCode ? (
                  <span className="ml-1 font-mono text-xs text-neutral-500">
                    ({order.voucherCode})
                  </span>
                ) : null}
              </span>
              <span className="font-semibold text-emerald-700">
                -{" "}
                {formatProductPriceWithPrefix(
                  voucherAmount,
                  SITE_PRODUCT_SLIDER.pricePrefix,
                )}
              </span>
            </div>
          ) : null}
          <div className="flex items-center justify-between text-neutral-700">
            <span>Shipping</span>
            <span className="font-semibold text-neutral-900">
              {shippingLabel}
            </span>
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-700">Total</p>
            <p className="text-xl font-bold text-[var(--store-brand-primary)]">
              {formatProductPriceWithPrefix(
                Number(order.totalAmount),
                SITE_PRODUCT_SLIDER.pricePrefix,
              )}
            </p>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Taxes and fees as applicable at checkout.
          </p>
        </div>

        <Link href={SITE_ROUTES.accountOrders} className="mt-5 block">
          <Button
            type="button"
            variant="primary"
            size="md"
            fullWidth
            className="rounded-full"
          >
            All orders
          </Button>
        </Link>
        <Link href="/products" className="mt-2 block">
          <Button
            type="button"
            variant="accent"
            size="md"
            fullWidth
            className="rounded-full"
          >
            Continue shopping
          </Button>
        </Link>
      </aside>
    </div>
  );
};
