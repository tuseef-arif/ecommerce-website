import "server-only";

import type { SalesDayPoint } from "@/lib/dashboard/sales-chart-shared";
import {
  calendarDayKeyInTimeZone,
  getInstantRangeForCalendarDayKeys,
  getLastNCalendarDayKeysInTimeZone,
  STORE_DISPLAY_TIME_ZONE,
} from "@/lib/datetime/display-timezone";
import { prisma } from "@/lib/prisma";

export type { SalesDayPoint } from "@/lib/dashboard/sales-chart-shared";

/**
 * Daily revenue for the last `dayCount` **calendar days** in
 * {@link STORE_DISPLAY_TIME_ZONE} (including “today” in that zone),
 * one point per day (zero when no matching orders).
 *
 * Orders are bucketed by `createdAt` mapped to that zone’s `YYYY-MM-DD`.
 */
export const getSalesRevenueByDay = async (
  dayCount: number = 30,
): Promise<SalesDayPoint[]> => {
  const dayKeys = getLastNCalendarDayKeysInTimeZone(
    dayCount,
    STORE_DISPLAY_TIME_ZONE,
  );
  const { start, end } = getInstantRangeForCalendarDayKeys(dayKeys);

  const orders = await prisma.order.findMany({
    where: {
      status: { not: "CANCELLED" },
      createdAt: { gte: start, lte: end },
    },
    select: { createdAt: true, totalAmount: true },
  });

  const totals = new Map<string, number>();
  for (const key of dayKeys) {
    totals.set(key, 0);
  }

  for (const row of orders) {
    const key = calendarDayKeyInTimeZone(
      row.createdAt,
      STORE_DISPLAY_TIME_ZONE,
    );
    if (!totals.has(key)) continue;
    const amt = Number.parseFloat(row.totalAmount.toString());
    totals.set(key, (totals.get(key) ?? 0) + (Number.isFinite(amt) ? amt : 0));
  }

  return dayKeys.map((day) => ({
    day,
    revenue: totals.get(day) ?? 0,
  }));
};

/** @deprecated Use {@link getSalesRevenueByDay}; kept for older imports. */
export const getSalesRevenueByDayUtc = getSalesRevenueByDay;
