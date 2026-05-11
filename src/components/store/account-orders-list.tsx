import Link from "next/link";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { ProductImageWithFallback } from "@/components/store/product-image-with-fallback";
import { Button } from "@/components/ui/button";
import { SITE_PRODUCT_SLIDER, SITE_ROUTES } from "@/lib/config/site-config";
import { formatInstantForStoreDate } from "@/lib/datetime/display-timezone";
import type { AccountOrderListItem } from "@/lib/orders/account-orders";
import { formatStoreOrderNumber } from "@/lib/orders/account-orders";
import { formatProductPriceWithPrefix } from "@/lib/products/format-price";

type AccountOrdersListProps = {
  orders: AccountOrderListItem[];
};

export const AccountOrdersList = ({ orders }: AccountOrdersListProps) => {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-10 text-center shadow-sm">
        <p className="text-base text-neutral-600">
          You have not placed any orders yet. When you do, they will appear
          here.
        </p>
        <Link href="/products" className="mt-5 inline-flex">
          <Button
            type="button"
            variant="primary"
            size="md"
            className="rounded-full px-6"
          >
            Browse products
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-4" aria-label="Your orders">
      {orders.map((order) => {
        const href = `${SITE_ROUTES.accountOrders}/${order.id}`;
        const orderNumber = formatStoreOrderNumber(order.id);
        const dateLabel = formatInstantForStoreDate(order.createdAt);

        return (
          <li key={order.id}>
            <Link
              href={href}
              className="block rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
            >
              <div className="flex gap-3 sm:gap-4">
                <div className="block h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-50 sm:h-24 sm:w-24">
                  <ProductImageWithFallback
                    src={order.previewImagePath}
                    alt={`First item preview for order ${orderNumber}`}
                    className="h-full w-full rounded-xl border border-neutral-100 bg-neutral-50 object-contain p-2"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-neutral-500">
                        Order {orderNumber}
                      </p>
                      <p className="mt-0.5 text-sm text-neutral-600">
                        {dateLabel}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="flex flex-wrap items-end justify-between gap-2 border-t border-dashed border-neutral-200 pt-3">
                    <p className="text-sm text-neutral-600">
                      {order.itemCount}{" "}
                      {order.itemCount === 1 ? "item" : "items"}
                    </p>
                    <p className="text-base font-bold text-[var(--store-brand-primary)] sm:text-lg">
                      {formatProductPriceWithPrefix(
                        Number(order.totalAmount),
                        SITE_PRODUCT_SLIDER.pricePrefix,
                      )}
                    </p>
                  </div>
                  <p className="text-xs font-medium text-[var(--store-brand-primary)]">
                    View details →
                  </p>
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};
