import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OrderFilters } from "@/components/admin/order-filters";
import { OrderListStatusBanner } from "@/components/admin/order-list-status-banner";
import { OrderPagination } from "@/components/admin/order-pagination";
import { OrderTable } from "@/components/admin/order-table";
import { listAdminOrders } from "@/lib/orders/admin-data";
import {
  parseAdminOrdersListFilters,
  parseAdminOrdersListStatus,
} from "@/lib/orders/filters";

type DashboardOrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  title: "Orders · Admin",
};

export default async function DashboardOrdersPage({
  searchParams,
}: DashboardOrdersPageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = parseAdminOrdersListFilters(resolvedSearchParams);
  const status = parseAdminOrdersListStatus(resolvedSearchParams.status);

  const orders = await listAdminOrders(filters);

  return (
    <>
      <AdminPageHeader
        title="Orders"
        description="Track fulfillment, manage statuses, and edit order details."
        actions={
          <Link
            href="/dashboard/orders/new"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--store-brand-primary)] px-4 text-sm font-semibold text-white shadow-sm transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
          >
            + Create order
          </Link>
        }
      />

      <OrderListStatusBanner status={status} />

      <OrderFilters filters={filters} />

      <OrderTable items={orders.items} />

      <OrderPagination
        filters={filters}
        page={orders.page}
        pageCount={orders.pageCount}
        totalCount={orders.totalCount}
      />
    </>
  );
}
