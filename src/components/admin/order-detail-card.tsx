import { OrderDetailActions } from "@/components/admin/order-detail-actions";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import type { AdminOrderDetail } from "@/lib/orders/admin-types";
import { SITE_PRODUCT_SLIDER } from "@/lib/config/site-config";
import type { OrderStatus } from "@/generated/prisma/enums";

type OrderDetailCardProps = {
  order: AdminOrderDetail;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

const formatDateTime = (iso: string | null): string => {
  if (!iso) return "—";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "—";
  return dateFormatter.format(parsed);
};

const getStatusDateLine = (order: AdminOrderDetail): string => {
  const statusToLabel: Record<OrderStatus, string> = {
    PENDING: "Placed",
    CONFIRMED: "Confirmed",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
  };

  const statusToDateIso: Record<OrderStatus, string | null> = {
    PENDING: order.createdAtIso,
    CONFIRMED: order.updatedAtIso,
    SHIPPED: order.shippedAtIso ?? order.updatedAtIso,
    DELIVERED: order.deliveredAtIso ?? order.updatedAtIso,
  };

  const label = statusToLabel[order.status];
  const formattedDate = formatDateTime(statusToDateIso[order.status]);
  return `${label} ${formattedDate}`;
};

const formatMoney = (raw: string): string => {
  const numeric = Number.parseFloat(raw);
  if (!Number.isFinite(numeric)) return raw;
  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const OrderDetailCard = ({ order }: OrderDetailCardProps) => {
  const currencyPrefix = SITE_PRODUCT_SLIDER.pricePrefix;
  return (
    <section className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-mono text-lg font-semibold text-neutral-900">
            #{order.shortId}
          </h2>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="text-sm text-neutral-600">
          {order.customer.displayName}{" "}
          <span className="text-neutral-400">·</span> {order.customer.email}
        </p>
        <p className="text-xs text-neutral-500">{getStatusDateLine(order)}</p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Order items
        </h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="py-2 pr-3">Product</th>
                <th className="py-2 pr-3">Variant</th>
                <th className="py-2 pr-3 text-right">Unit price</th>
                <th className="py-2 pr-3 text-right">Discount</th>
                <th className="py-2 pr-3 text-right">Line price</th>
                <th className="py-2 pr-3 text-right">Qty</th>
                <th className="py-2 text-right">Line total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {order.items.map((item) => {
                const colorDelta = Number.parseFloat(item.colorPriceDelta);
                const storageDelta = Number.parseFloat(item.storagePriceDelta);
                const discounted = Number.parseFloat(item.discountedPrice);
                const linePrice = Number.isFinite(discounted)
                  ? discounted +
                    (Number.isFinite(colorDelta) ? colorDelta : 0) +
                    (Number.isFinite(storageDelta) ? storageDelta : 0)
                  : Number.NaN;
                const variantSegments: string[] = [];
                if (item.selectedColor) {
                  variantSegments.push(
                    colorDelta > 0
                      ? `${item.selectedColor} (+${currencyPrefix} ${formatMoney(item.colorPriceDelta)})`
                      : item.selectedColor,
                  );
                }
                if (item.selectedStorage) {
                  variantSegments.push(
                    storageDelta > 0
                      ? `${item.selectedStorage} (+${currencyPrefix} ${formatMoney(item.storagePriceDelta)})`
                      : item.selectedStorage,
                  );
                }
                return (
                  <tr key={item.id}>
                    <td className="py-2 pr-3 font-medium text-neutral-900">
                      {item.productName}
                    </td>
                    <td className="py-2 pr-3 text-neutral-700">
                      {variantSegments.length > 0
                        ? variantSegments.join(" · ")
                        : "—"}
                    </td>
                    <td className="py-2 pr-3 text-right font-mono tabular-nums text-neutral-700">
                      {currencyPrefix} {formatMoney(item.unitPrice)}
                    </td>
                    <td className="py-2 pr-3 text-right text-neutral-600">
                      {Number.parseFloat(item.discountPercent) > 0
                        ? `${formatMoney(item.discountPercent)}%`
                        : "—"}
                    </td>
                    <td className="py-2 pr-3 text-right font-mono tabular-nums text-neutral-700">
                      {currencyPrefix}{" "}
                      {Number.isFinite(linePrice)
                        ? formatMoney(linePrice.toFixed(2))
                        : formatMoney(item.discountedPrice)}
                    </td>
                    <td className="py-2 pr-3 text-right font-mono tabular-nums text-neutral-900">
                      {item.quantity}
                    </td>
                    <td className="py-2 text-right font-mono font-semibold tabular-nums text-neutral-900">
                      {currencyPrefix} {formatMoney(item.lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} />
                <td className="pt-3 text-right text-sm text-neutral-500">
                  Subtotal
                </td>
                <td className="pt-3 text-right font-mono tabular-nums text-neutral-700">
                  {currencyPrefix} {formatMoney(order.subtotal)}
                </td>
              </tr>
              <tr>
                <td colSpan={5} />
                <td className="pt-1 text-right text-sm text-neutral-500">
                  Discount
                </td>
                <td className="pt-1 text-right font-mono tabular-nums text-neutral-700">
                  − {currencyPrefix} {formatMoney(order.discountAmount)}
                </td>
              </tr>
              <tr>
                <td colSpan={5} />
                <td className="pt-1 text-right text-sm font-semibold text-neutral-700">
                  Total
                </td>
                <td className="pt-1 text-right font-mono font-semibold tabular-nums text-neutral-900">
                  {currencyPrefix} {formatMoney(order.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-neutral-200 pt-4">
        <OrderDetailActions orderId={order.id} shortId={order.shortId} />
      </div>
    </section>
  );
};
