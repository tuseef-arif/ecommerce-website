import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CustomerFilters } from "@/components/admin/customer-filters";
import { CustomerListStatusBanner } from "@/components/admin/customer-list-status-banner";
import { CustomerPagination } from "@/components/admin/customer-pagination";
import { CustomerTable } from "@/components/admin/customer-table";
import { listAdminCustomers } from "@/lib/customers/admin-data";
import {
  parseAdminCustomersListFilters,
  parseAdminCustomersListStatus,
} from "@/lib/customers/filters";

type DashboardCustomersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  title: "Customers · Admin",
};

export default async function DashboardCustomersPage({
  searchParams,
}: DashboardCustomersPageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = parseAdminCustomersListFilters(resolvedSearchParams);
  const status = parseAdminCustomersListStatus(resolvedSearchParams.status);

  const customers = await listAdminCustomers(filters);

  return (
    <>
      <AdminPageHeader
        title="Customers"
        description="Manage shoppers and admins: contact info, roles, and access."
        actions={
          <Link
            href="/dashboard/customers/new"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--store-brand-primary)] px-4 text-sm font-semibold text-white shadow-sm transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
          >
            + Create customer
          </Link>
        }
      />

      <CustomerListStatusBanner status={status} />

      <CustomerFilters filters={filters} />

      <CustomerTable items={customers.items} />

      <CustomerPagination
        filters={filters}
        page={customers.page}
        pageCount={customers.pageCount}
        totalCount={customers.totalCount}
      />
    </>
  );
}
