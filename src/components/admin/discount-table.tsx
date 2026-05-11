import Link from "next/link";
import { DiscountRowActions } from "@/components/admin/discount-row-actions";
import { IconPencil } from "@/components/icons";
import { StatusBadge } from "@/components/ui/status-badge";
import { discountTypeLabel } from "@/lib/discounts/constants";
import { ADMIN_DISCOUNT_TABLE_COLUMNS } from "@/lib/discounts/table-columns";
import type { AdminDiscountListItem } from "@/lib/discounts/admin-types";

type DiscountTableProps = {
  items: ReadonlyArray<AdminDiscountListItem>;
  listQueryString: string;
};

export const DiscountTable = ({
  items,
  listQueryString,
}: DiscountTableProps) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
        <p className="text-base font-semibold text-neutral-900">
          No discounts match your filters.
        </p>
        <p className="text-sm text-neutral-500">
          Try clearing filters, or create a discount to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] table-fixed text-left text-sm">
          <colgroup>
            <col style={{ width: "2.5rem" }} />
          </colgroup>
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            <tr>
              {ADMIN_DISCOUNT_TABLE_COLUMNS.map((col) => {
                const isEdit = col.id === "edit";
                const thClass = [
                  isEdit
                    ? "w-0 p-0 py-3 pl-2 pr-0 text-center"
                    : `${col.widthClass} px-4 py-3`,
                  "align" in col && col.align === "right" ? "text-right" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <th key={col.id} scope="col" className={thClass}>
                    {"srOnly" in col && col.srOnly ? (
                      <span className="sr-only">{col.label}</span>
                    ) : (
                      col.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {items.map((item) => {
              const editHref = listQueryString
                ? `/dashboard/discounts/${item.id}/edit?${listQueryString}`
                : `/dashboard/discounts/${item.id}/edit`;
              return (
                <tr key={item.id} className="hover:bg-neutral-50/60">
                  <td className="w-0 p-0 py-3 pl-2 pr-0 text-center align-middle">
                    <Link
                      href={editHref}
                      className="inline-flex size-7 items-center justify-center rounded-md text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
                      aria-label={`Edit discount ${item.name}`}
                    >
                      <IconPencil width={16} height={16} />
                    </Link>
                  </td>
                  <td className="px-4 py-3 pl-2">
                    <p className="truncate font-semibold text-neutral-900">
                      {item.name}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-semibold uppercase text-neutral-800">
                      {item.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {discountTypeLabel(item.discountType)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-neutral-900">
                    {item.discountValueDisplay}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-neutral-700">
                    {item.minOrderAmountDisplay ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-neutral-700">
                    {item.maxDiscountAmountDisplay ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {item.startDateDisplay ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {item.endDateDisplay ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={item.isActive ? "success" : "neutral"}>
                      {item.isActive ? "Active" : "Inactive"}
                    </StatusBadge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <DiscountRowActions
                      discountId={item.id}
                      discountName={item.name}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
