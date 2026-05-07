import Link from "next/link";
import { buildAdminCustomersListHref } from "@/lib/customers/filters";
import type { AdminCustomersListFilters } from "@/lib/customers/admin-types";

type CustomerPaginationProps = {
  filters: AdminCustomersListFilters;
  page: number;
  pageCount: number;
  totalCount: number;
};

const linkClass =
  "inline-flex h-9 items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50";

const disabledClass =
  "inline-flex h-9 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm font-semibold text-neutral-400";

export const CustomerPagination = ({
  filters,
  page,
  pageCount,
  totalCount,
}: CustomerPaginationProps) => {
  if (pageCount <= 1 && totalCount > 0) return null;
  if (totalCount === 0) return null;

  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < pageCount ? page + 1 : null;

  const buildHref = (targetPage: number) =>
    buildAdminCustomersListHref({ ...filters, page: targetPage });

  return (
    <nav
      className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-3 text-sm shadow-sm sm:flex-row"
      aria-label="Customers pagination"
    >
      <p className="text-neutral-600">
        Page <span className="font-semibold text-neutral-900">{page}</span> of{" "}
        <span className="font-semibold text-neutral-900">{pageCount}</span> ·{" "}
        <span className="font-semibold text-neutral-900">{totalCount}</span>{" "}
        customer{totalCount === 1 ? "" : "s"} total
      </p>
      <div className="flex items-center gap-2">
        {prevPage ? (
          <Link href={buildHref(prevPage)} className={linkClass} rel="prev">
            Previous
          </Link>
        ) : (
          <span aria-disabled className={disabledClass}>
            Previous
          </span>
        )}
        {nextPage ? (
          <Link href={buildHref(nextPage)} className={linkClass} rel="next">
            Next
          </Link>
        ) : (
          <span aria-disabled className={disabledClass}>
            Next
          </span>
        )}
      </div>
    </nav>
  );
};
