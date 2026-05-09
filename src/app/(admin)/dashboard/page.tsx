import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DashboardMetricCards } from "@/components/admin/dashboard-metric-cards";
import { DashboardSalesAnalytics } from "@/components/admin/dashboard-sales-analytics";
import { DashboardTopProducts } from "@/components/admin/dashboard-top-products";
import { requireAdmin } from "@/lib/auth-guards";
import { SITE_PRODUCT_SLIDER } from "@/lib/config/site-config";
import { getAdminDashboardMetrics } from "@/lib/dashboard/admin-metrics";
import { parseSalesChartRangeDays } from "@/lib/dashboard/sales-range";
import { getSalesRevenueByDay } from "@/lib/dashboard/sales-analytics";
import { getAdminDashboardTopProducts } from "@/lib/dashboard/top-products";

const SalesAnalyticsFallback = () => (
  <div className="flex h-full min-h-0 flex-1 flex-col gap-4" aria-hidden>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="h-7 w-40 rounded-lg bg-neutral-200/80" />
      <div className="h-10 w-36 rounded-xl bg-neutral-200/80" />
    </div>
    <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-50">
      <div className="h-56 w-full max-w-full rounded-xl bg-neutral-200/40" />
    </div>
  </div>
);

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const user = await requireAdmin();
  const resolvedSearchParams = await searchParams;
  const salesDays = parseSalesChartRangeDays(resolvedSearchParams);

  const [metrics, topProducts, salesSeries] = await Promise.all([
    getAdminDashboardMetrics(),
    getAdminDashboardTopProducts(),
    getSalesRevenueByDay(salesDays),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description={`${user.firstName ? `Hi ${user.firstName}, ` : "Hi, "}Plan, prioritize, and accomplish your tasks with ease.`}
      />

      <DashboardMetricCards
        currencyPrefix={SITE_PRODUCT_SLIDER.pricePrefix}
        totalRevenue={metrics.totalRevenueAmount}
        totalOrders={metrics.totalOrdersExcludingCancelled}
        totalCustomers={metrics.activeCustomerCount}
        pendingDelivery={metrics.pendingDeliveryCount}
      />

      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
        <section className="flex h-full min-h-[22rem] flex-col rounded-2xl border border-neutral-200 bg-white p-5 text-left shadow-sm">
          <Suspense fallback={<SalesAnalyticsFallback />}>
            <DashboardSalesAnalytics
              points={salesSeries}
              currencyPrefix={SITE_PRODUCT_SLIDER.pricePrefix}
              rangeDays={salesDays}
            />
          </Suspense>
        </section>

        <DashboardTopProducts items={topProducts} />
      </div>
    </>
  );
}
