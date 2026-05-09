/** Shared types for sales chart (importable from client and server). */

export type SalesChartRangeDays = 7 | 30;

export type SalesDayPoint = {
  /** Civil calendar date `YYYY-MM-DD` in the store display zone (Pakistan). */
  day: string;
  /** Sum of `totalAmount` for non-cancelled orders whose `createdAt` falls on that civil day in the store zone. */
  revenue: number;
};
