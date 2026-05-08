import Link from "next/link";
import { OrderRowActions } from "@/components/admin/order-row-actions";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import type { AdminOrderListItem } from "@/lib/orders/admin-types";

type OrderTableProps = {
  items: ReadonlyArray<AdminOrderListItem>;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const formatDate = (iso: string): string => {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return dateFormatter.format(parsed);
};

const formatMoney = (raw: string): string => {
  const numeric = Number.parseFloat(raw);
  if (!Number.isFinite(numeric)) return raw;
  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const OrderTable = ({ items }: OrderTableProps) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
        <p className="text-base font-semibold text-neutral-900">
          No orders match your filters.
        </p>
        <p className="text-sm text-neutral-500">
          Try clearing filters, or create a new order to populate the list.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] table-fixed text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            <tr>
              <th scope="col" className="w-[14%] px-4 py-3">
                Order
              </th>
              <th scope="col" className="w-[24%] px-4 py-3">
                Customer
              </th>
              <th scope="col" className="w-[14%] px-4 py-3">
                Status
              </th>
              <th scope="col" className="w-[11%] px-4 py-3 text-right">
                Items
              </th>
              <th scope="col" className="w-[12%] px-4 py-3 text-right">
                Total
              </th>
              <th scope="col" className="w-[13%] px-4 py-3">
                Created
              </th>
              <th scope="col" className="w-[12%] px-4 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-neutral-50/60">
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/orders/${item.id}`}
                    className="font-mono text-xs font-semibold uppercase text-neutral-900 transition-colors hover:text-[var(--store-brand-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
                  >
                    #{item.shortId}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/customers/${item.customer.id}`}
                    className="block truncate font-semibold text-neutral-900 transition-colors hover:text-[var(--store-brand-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
                  >
                    {item.customer.displayName}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-neutral-900">
                  {item.itemsQuantity}
                  <span className="ml-1 text-xs text-neutral-500">
                    ({item.itemsCount}{" "}
                    {item.itemsCount === 1 ? "line" : "lines"})
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-neutral-900">
                  {formatMoney(item.totalAmount)}
                </td>
                <td className="px-4 py-3 text-neutral-700">
                  {formatDate(item.createdAtIso)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <OrderRowActions orderId={item.id} shortId={item.shortId} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
