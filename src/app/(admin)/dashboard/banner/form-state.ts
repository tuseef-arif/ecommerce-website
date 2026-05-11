/**
 * Shared types and the initial state for the hero slide create/update form.
 * Lives in its own (non-"use server") module so it can export plain values
 * (objects, types) without violating the Next.js rule that "use server" files
 * may only export async functions.
 */

export type HeroSlideFormFieldKey =
  | "name"
  | "imageAlt"
  | "image"
  | "specs"
  | "linkedProducts"
  | "sortOrder"
  | "isActive";

export type HeroSlideFormState = {
  errorMessage: string | null;
  fieldErrors: Partial<Record<HeroSlideFormFieldKey, string>>;
};

export const initialHeroSlideFormState: HeroSlideFormState = {
  errorMessage: null,
  fieldErrors: {},
};

export type DeleteHeroSlideResult =
  | { ok: true }
  | {
      ok: false;
      error: "invalid_id" | "not_found" | "unknown";
    };
