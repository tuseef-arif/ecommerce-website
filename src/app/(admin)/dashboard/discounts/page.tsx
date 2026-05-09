import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DiscountFilters } from "@/components/admin/discount-filters";
import { DiscountListStatusBanner } from "@/components/admin/discount-list-status-banner";
import { DiscountPagination } from "@/components/admin/discount-pagination";
import { DiscountTable } from "@/components/admin/discount-table";
import { listAdminDiscounts } from "@/lib/discounts/admin-data";
import {
  buildAdminDiscountsListQueryString,
  parseAdminDiscountsListFilters,
  parseAdminDiscountsListStatus,
} from "@/lib/discounts/filters";

type DashboardDiscountsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  title: "Discounts · Admin",
};

export default async function DashboardDiscountsPage({
  searchParams,
}: DashboardDiscountsPageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = parseAdminDiscountsListFilters(resolvedSearchParams);
  const status = parseAdminDiscountsListStatus(resolvedSearchParams.status);

  const discounts = await listAdminDiscounts(filters);

  return (
    <>
      <AdminPageHeader
        title="Discounts"
        description="Create and manage fixed or percentage discounts: codes, caps, and eligibility windows."
        actions={
          <Link
            href="/dashboard/discounts/new"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--store-brand-primary)] px-4 text-sm font-semibold text-white shadow-sm transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
          >
            + Create discount
          </Link>
        }
      />

      <DiscountListStatusBanner status={status} />

      <DiscountFilters filters={filters} />

      <DiscountTable
        items={discounts.items}
        listQueryString={buildAdminDiscountsListQueryString(filters)}
      />

      <DiscountPagination
        filters={filters}
        page={discounts.page}
        pageCount={discounts.pageCount}
        totalCount={discounts.totalCount}
      />
    </>
  );
}
