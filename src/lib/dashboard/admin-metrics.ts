import "server-only";

import { prisma } from "@/lib/prisma";

export type AdminDashboardMetrics = {
  /** Sum of delivered order totals (for dashboard animation / display). */
  totalRevenueAmount: number;
  totalOrdersExcludingCancelled: number;
  activeCustomerCount: number;
  pendingDeliveryCount: number;
};

/**
 * Aggregate KPIs for the admin dashboard home.
 *
 * - Revenue: sum of `totalAmount` for orders in `DELIVERED` status.
 * - Orders: count of orders excluding `CANCELLED`.
 * - Customers: count of shopper accounts (`USER` role) with `ACTIVE` status.
 * - Pending delivery: orders in `PENDING` or `CONFIRMED`.
 */
export const getAdminDashboardMetrics =
  async (): Promise<AdminDashboardMetrics> => {
    const [
      deliveredTotals,
      totalOrdersExcludingCancelled,
      activeCustomerCount,
      pendingDeliveryCount,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { status: "DELIVERED" },
        _sum: { totalAmount: true },
      }),
      prisma.order.count({
        where: { status: { not: "CANCELLED" } },
      }),
      prisma.user.count({
        where: { role: "USER", status: "ACTIVE" },
      }),
      prisma.order.count({
        where: { status: { in: ["PENDING", "CONFIRMED"] } },
      }),
    ]);

    const sum = deliveredTotals._sum.totalAmount;
    const totalRevenueAmount =
      sum === null || sum === undefined ? 0 : Number.parseFloat(sum.toString());

    return {
      totalRevenueAmount: Number.isFinite(totalRevenueAmount)
        ? totalRevenueAmount
        : 0,
      totalOrdersExcludingCancelled,
      activeCustomerCount,
      pendingDeliveryCount,
    };
  };
