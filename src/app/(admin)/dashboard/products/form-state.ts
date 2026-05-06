/**
 * Shared types and the initial state for the product create/update form.
 *
 * Lives in its own (non-"use server") module so it can export plain values
 * (objects, types) without violating the Next.js rule that "use server" files
 * may only export async functions.
 */

export type ProductFormFieldKey =
  | "name"
  | "brand"
  | "model"
  | "description"
  | "categoryId"
  | "price"
  | "discountType"
  | "discountValue"
  | "stock"
  | "isActive"
  | "image"
  | "specs"
  | "colors"
  | "storages";

export type ProductFormState = {
  errorMessage: string | null;
  fieldErrors: Partial<Record<ProductFormFieldKey, string>>;
};

export const initialProductFormState: ProductFormState = {
  errorMessage: null,
  fieldErrors: {},
};

export type DeleteProductResult =
  | { ok: true }
  | { ok: false; error: "invalid_id" | "not_found" | "in_use" | "unknown" };
