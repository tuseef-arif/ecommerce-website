/**
 * Shared types and the initial state for the customer create/update form.
 * Lives in its own (non-"use server") module so it can export plain values
 * (objects, types) without violating the Next.js rule that "use server" files
 * may only export async functions.
 */

export type CustomerFormFieldKey =
  | "email"
  | "firstName"
  | "lastName"
  | "phone"
  | "address"
  | "city"
  | "country"
  | "role"
  | "status"
  | "password";

export type CustomerFormState = {
  errorMessage: string | null;
  fieldErrors: Partial<Record<CustomerFormFieldKey, string>>;
};

export const initialCustomerFormState: CustomerFormState = {
  errorMessage: null,
  fieldErrors: {},
};

export type DeleteCustomerResult =
  | { ok: true }
  | {
      ok: false;
      error: "invalid_id" | "not_found" | "self_delete" | "in_use" | "unknown";
    };
