import "server-only";

import type { SalesChartRangeDays } from "@/lib/dashboard/sales-chart-shared";

export type { SalesChartRangeDays } from "@/lib/dashboard/sales-chart-shared";

export const parseSalesChartRangeDays = (
  searchParams: Record<string, string | string[] | undefined>,
): SalesChartRangeDays => {
  const raw = searchParams.sales;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "30") return 30;
  return 7;
};
