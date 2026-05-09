import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import { computeAppliedDiscountAmount } from "@/lib/discounts/compute-applied-discount";
import type { DiscountTypeValue } from "@/lib/discounts/constants";
import {
  calendarDayKeyInTimeZone,
  STORE_DISPLAY_TIME_ZONE,
} from "@/lib/datetime/display-timezone";

export type ResolveCartVoucherResult =
  | { ok: true; appliedAmount: number; code: string; name: string }
  | { ok: false; error: string };

type DbWithDiscount = Pick<PrismaClient, "discount">;

export const normalizeVoucherCode = (raw: string): string =>
  raw.trim().toUpperCase();

const isWithinCalendarWindow = (
  startAt: Date | null,
  endAt: Date | null,
  now: Date,
): { ok: true } | { ok: false; error: string } => {
  const tz = STORE_DISPLAY_TIME_ZONE;
  const nowDay = calendarDayKeyInTimeZone(now, tz);
  if (startAt) {
    const startDay = calendarDayKeyInTimeZone(startAt, tz);
    if (nowDay < startDay) {
      return { ok: false, error: "This voucher is not active yet." };
    }
  }
  if (endAt) {
    const endDay = calendarDayKeyInTimeZone(endAt, tz);
    if (nowDay > endDay) {
      return { ok: false, error: "This voucher has expired." };
    }
  }
  return { ok: true };
};

const toNumber = (
  d: { toString(): string } | null | undefined,
): number | null => {
  if (d === null || d === undefined) return null;
  const n = Number.parseFloat(d.toString());
  return Number.isFinite(n) ? n : null;
};

/**
 * Validates a cart voucher against DB rules and returns the amount to subtract
 * from the cart net (post–product-discount) subtotal.
 */
export const resolveCartVoucher = async (
  db: DbWithDiscount,
  rawCode: string,
  cartNetSubtotal: number,
  now: Date = new Date(),
): Promise<ResolveCartVoucherResult> => {
  const code = normalizeVoucherCode(rawCode);
  if (code.length === 0) {
    return { ok: false, error: "Enter a voucher code." };
  }

  const row = await db.discount.findUnique({
    where: { code },
    select: {
      name: true,
      code: true,
      discountType: true,
      discountValue: true,
      minOrderAmount: true,
      maxDiscountAmount: true,
      startAt: true,
      endAt: true,
      isActive: true,
    },
  });

  if (!row) {
    return { ok: false, error: "We could not find that voucher code." };
  }

  if (!row.isActive) {
    return { ok: false, error: "This voucher is not active." };
  }

  const window = isWithinCalendarWindow(row.startAt, row.endAt, now);
  if (!window.ok) return window;

  const discountType = row.discountType as DiscountTypeValue;
  const discountValue = Number.parseFloat(row.discountValue.toString());
  if (!Number.isFinite(discountValue)) {
    return {
      ok: false,
      error: "This voucher is misconfigured. Contact support.",
    };
  }

  const minOrderAmount = toNumber(row.minOrderAmount);
  const maxDiscountAmount = toNumber(row.maxDiscountAmount);

  const computed = computeAppliedDiscountAmount({
    orderTotal: cartNetSubtotal,
    discountType,
    discountValue,
    minOrderAmount,
    maxDiscountAmount,
  });

  if (computed.skippedReason === "below_minimum") {
    const minStr =
      minOrderAmount !== null && Number.isFinite(minOrderAmount)
        ? minOrderAmount.toFixed(2)
        : "0.00";
    return {
      ok: false,
      error: `This voucher requires a minimum order of ${minStr} (before the voucher).`,
    };
  }

  if (
    computed.skippedReason === "invalid_total" ||
    computed.appliedAmount <= 0
  ) {
    return {
      ok: false,
      error: "This voucher cannot be applied to your current cart total.",
    };
  }

  return {
    ok: true,
    appliedAmount: computed.appliedAmount,
    code: row.code,
    name: row.name,
  };
};
