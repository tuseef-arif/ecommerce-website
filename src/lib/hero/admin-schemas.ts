import { z } from "zod";

export const HERO_SLIDE_NAME_MAX = 120;
export const HERO_SLIDE_ALT_MAX = 200;
export const HERO_SLIDE_SPEC_MAX_LENGTH = 200;
export const HERO_SLIDE_SPEC_MAX_COUNT = 12;
export const HERO_SLIDE_SORT_ORDER_MAX = 9999;
/** Cap on linked products per slide. Mirrored on the server in `admin-data.ts`. */
export const HERO_SLIDE_LINKED_PRODUCT_MAX = 12;
/** Max byte length we will tolerate for a product id from the form. */
export const HERO_SLIDE_PRODUCT_ID_MAX_LENGTH = 40;

const trimmed = (max: number) =>
  z
    .string()
    .max(max)
    .transform((value) => value.trim());

/**
 * Parses the JSON payload produced by the picker (a hidden input stringifies
 * a `string[]` of product ids). Tolerates an empty list (linking is optional);
 * throws when the shape, length, or count is invalid.
 */
export const parseHeroLinkedProductIdsJsonInput = (raw: string): string[] => {
  const trimmedRaw = raw.trim();
  if (trimmedRaw.length === 0) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmedRaw);
  } catch {
    throw new Error("Linked products are not in a recognizable format.");
  }
  if (!Array.isArray(parsed)) {
    throw new Error("Linked products must be a list.");
  }

  const out: string[] = [];
  const seen = new Set<string>();
  for (const entry of parsed) {
    if (typeof entry !== "string") continue;
    const value = entry.trim();
    if (value.length === 0) continue;
    if (value.length > HERO_SLIDE_PRODUCT_ID_MAX_LENGTH) {
      throw new Error("One of the linked product ids is invalid.");
    }
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }

  if (out.length > HERO_SLIDE_LINKED_PRODUCT_MAX) {
    throw new Error(
      `Link up to ${HERO_SLIDE_LINKED_PRODUCT_MAX} products per slide.`,
    );
  }
  return out;
};

/**
 * Parses the JSON payload produced by the admin specs editor (a hidden input
 * stringifies a `string[]`). Throws when shape or count is invalid so the
 * action surfaces a clean field-level error.
 */
export const parseHeroSpecsJsonInput = (raw: string): string[] => {
  const trimmedRaw = raw.trim();
  if (trimmedRaw.length === 0) {
    throw new Error("Add at least one spec line.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmedRaw);
  } catch {
    throw new Error("Specs are not in a recognizable format.");
  }
  if (!Array.isArray(parsed)) {
    throw new Error("Specs must be a list.");
  }

  const cleaned: string[] = [];
  for (const entry of parsed) {
    if (typeof entry !== "string") continue;
    const value = entry.trim();
    if (value.length === 0) continue;
    if (value.length > HERO_SLIDE_SPEC_MAX_LENGTH) {
      throw new Error(
        `Each spec must be ${HERO_SLIDE_SPEC_MAX_LENGTH} characters or fewer.`,
      );
    }
    cleaned.push(value);
  }

  if (cleaned.length === 0) {
    throw new Error("Add at least one spec line.");
  }
  if (cleaned.length > HERO_SLIDE_SPEC_MAX_COUNT) {
    throw new Error(`Add up to ${HERO_SLIDE_SPEC_MAX_COUNT} spec lines.`);
  }
  return cleaned;
};

const sortOrderInput = z
  .string()
  .max(8)
  .transform((value) => value.trim())
  .pipe(
    z
      .string()
      .regex(/^-?\d+$/, "Sort order must be a whole number.")
      .transform((value) => Number.parseInt(value, 10))
      .pipe(
        z
          .number()
          .int()
          .min(0, "Sort order cannot be negative.")
          .max(
            HERO_SLIDE_SORT_ORDER_MAX,
            `Sort order cannot exceed ${HERO_SLIDE_SORT_ORDER_MAX}.`,
          ),
      ),
  );

/**
 * Boundary schema for the hero slide create/edit form.
 * Inputs come from FormData as strings; outputs are Prisma-ready primitives.
 */
export const adminHeroSlideFormSchema = z.object({
  name: trimmed(HERO_SLIDE_NAME_MAX).pipe(
    z.string().min(1, "Name is required."),
  ),
  imageAlt: trimmed(HERO_SLIDE_ALT_MAX).pipe(
    z.string().min(1, "Image alt text is required for accessibility."),
  ),
  sortOrder: sortOrderInput,
  isActive: z
    .string()
    .optional()
    .transform((value) => value === "on" || value === "true"),
});

export type AdminHeroSlideFormParsed = z.infer<typeof adminHeroSlideFormSchema>;
