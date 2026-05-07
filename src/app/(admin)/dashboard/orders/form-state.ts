/**
 * Shared form state for admin order create/update flows. Lives outside the
 * "use server" actions module so it can export non-async values (objects,
 * unions, type-only exports).
 */

export type OrderFormFieldKey = "userId" | "status" | "items";

export type OrderFormState = {
  errorMessage: string | null;
  fieldErrors: Partial<Record<OrderFormFieldKey, string>>;
};

export const initialOrderFormState: OrderFormState = {
  errorMessage: null,
  fieldErrors: {},
};

export type DeleteOrderResult =
  | { ok: true }
  | { ok: false; error: "invalid_id" | "not_found" | "unknown" };
