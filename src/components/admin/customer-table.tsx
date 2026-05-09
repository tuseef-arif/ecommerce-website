import Link from "next/link";
import { CustomerRowActions } from "@/components/admin/customer-row-actions";
import { IconPencil } from "@/components/icons";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AdminCustomerListItem } from "@/lib/customers/admin-types";

type CustomerTableProps = {
  items: ReadonlyArray<AdminCustomerListItem>;
};

const initialFor = (name: string): string => {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "?";
  return trimmed.charAt(0).toUpperCase();
};

export const CustomerTable = ({ items }: CustomerTableProps) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
        <p className="text-base font-semibold text-neutral-900">
          No customers match your filters.
        </p>
        <p className="text-sm text-neutral-500">
          Try clearing filters, or create a new customer to populate the list.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] table-fixed text-left text-sm">
          <colgroup>
            <col style={{ width: "2.5rem" }} />
          </colgroup>
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            <tr>
              <th scope="col" className="w-0 p-0 py-3 pl-2 pr-0 text-center">
                <span className="sr-only">Edit</span>
              </th>
              <th scope="col" className="w-[27%] px-4 py-3">
                Customer
              </th>
              <th scope="col" className="w-[23%] px-4 py-3">
                Email
              </th>
              <th scope="col" className="w-[14%] px-4 py-3">
                Status
              </th>
              <th scope="col" className="w-[14%] px-4 py-3">
                Role
              </th>
              <th scope="col" className="w-[11%] px-4 py-3 text-right">
                Orders
              </th>
              <th scope="col" className="w-[11%] px-4 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-neutral-50/60">
                <td className="w-0 p-0 py-3 pl-2 pr-0 text-center align-middle">
                  <Link
                    href={`/dashboard/customers/${item.id}/edit`}
                    className="inline-flex size-7 items-center justify-center rounded-md text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
                    aria-label={`Edit customer ${item.displayName}`}
                  >
                    <IconPencil width={16} height={16} />
                  </Link>
                </td>
                <td className="px-4 py-3 pl-2">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-neutral-50 text-sm font-semibold text-neutral-500">
                      {item.profileImagePath ? (
                        // eslint-disable-next-line @next/next/no-img-element -- admin avatar; mixed local/remote
                        <img
                          src={item.profileImagePath}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span aria-hidden>{initialFor(item.displayName)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/customers/${item.id}`}
                        className="truncate font-semibold text-neutral-900 transition-colors hover:text-[var(--store-brand-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
                      >
                        {item.displayName}
                      </Link>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="max-w-[220px] truncate text-sm text-neutral-700">
                    {item.email}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    tone={item.status === "ACTIVE" ? "success" : "warning"}
                  >
                    {item.status === "ACTIVE" ? "Active" : "Inactive"}
                  </StatusBadge>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    tone={item.role === "ADMIN" ? "info" : "neutral"}
                  >
                    {item.role === "ADMIN" ? "Admin" : "User"}
                  </StatusBadge>
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-neutral-900">
                  {item.ordersCount}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <CustomerRowActions
                    customerId={item.id}
                    customerName={item.displayName}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
