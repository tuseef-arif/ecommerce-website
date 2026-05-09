import type { DiscountTypeValue } from "@/lib/discounts/constants";

const roundMoney = (n: number): number =>
  Math.round((n + Number.EPSILON) * 100) / 100;

export type ComputeAppliedDiscountInput = {
  orderTotal: number;
  discountType: DiscountTypeValue;
  /** Fixed: currency amount. Percentage: 1–100. */
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
};

export type ComputeAppliedDiscountResult = {
  appliedAmount: number;
  skippedReason: "below_minimum" | "invalid_total" | null;
};

/**
 * Computes how much discount applies to an order subtotal.
 * - Fixed: cannot exceed the order total.
 * - Percentage: raw = total × (value/100); if `maxDiscountAmount` is set,
 *   uses min(raw, max). Result is still capped by order total.
 */
export const computeAppliedDiscountAmount = ({
  orderTotal,
  discountType,
  discountValue,
  minOrderAmount,
  maxDiscountAmount,
}: ComputeAppliedDiscountInput): ComputeAppliedDiscountResult => {
  if (!Number.isFinite(orderTotal) || orderTotal <= 0) {
    return { appliedAmount: 0, skippedReason: "invalid_total" };
  }

  if (
    minOrderAmount !== null &&
    Number.isFinite(minOrderAmount) &&
    minOrderAmount > 0 &&
    orderTotal < minOrderAmount
  ) {
    return { appliedAmount: 0, skippedReason: "below_minimum" };
  }

  let raw = 0;
  if (discountType === "FIXED") {
    raw = Math.max(0, discountValue);
  } else {
    raw = (orderTotal * Math.max(0, discountValue)) / 100;
    if (
      maxDiscountAmount !== null &&
      Number.isFinite(maxDiscountAmount) &&
      maxDiscountAmount > 0
    ) {
      raw = Math.min(raw, maxDiscountAmount);
    }
  }

  const capped = Math.min(raw, orderTotal);
  return {
    appliedAmount: Number.isFinite(capped) ? roundMoney(capped) : 0,
    skippedReason: null,
  };
};
