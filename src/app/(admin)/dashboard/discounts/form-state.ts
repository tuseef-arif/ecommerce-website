/**
 * Shared types and the initial state for the discount create/update form.
 * Lives in its own (non-"use server") module so it can export plain values
 * (objects, types) without violating the Next.js rule that "use server" files
 * may only export async functions.
 */

export type DiscountFormFieldKey =
  | "name"
  | "code"
  | "discountType"
  | "discountValue"
  | "minOrderAmount"
  | "maxDiscountAmount"
  | "startDate"
  | "endDate"
  | "isActive";

export type DiscountFormState = {
  errorMessage: string | null;
  fieldErrors: Partial<Record<DiscountFormFieldKey, string>>;
};

export const initialDiscountFormState: DiscountFormState = {
  errorMessage: null,
  fieldErrors: {},
};

export type DeleteDiscountResult =
  | { ok: true }
  | {
      ok: false;
      error: "invalid_id" | "not_found" | "unknown";
    };
