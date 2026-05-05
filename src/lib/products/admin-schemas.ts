import { z } from "zod";

const trimmed = (max: number) =>
  z
    .string()
    .max(max)
    .transform((value) => value.trim());

const slugify = (raw: string): string =>
  raw
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);

/**
 * Boundary schema for the create/edit form.
 * Inputs come from FormData as strings; we coerce, trim, and bound them here
 * so the route action can pass clean data straight to Prisma.
 *
 * Slug is derived server-side from `name`; `productType` is no longer
 * collected from admins and falls back to the database default ("general").
 */
export const adminProductFormSchema = z
  .object({
    name: trimmed(200).pipe(
      z.string().min(2, "Name must be at least 2 characters."),
    ),
    brand: trimmed(80).pipe(z.string().min(1, "Brand is required.")),
    model: trimmed(120).pipe(z.string().min(1, "Model is required.")),
    description: trimmed(5000).optional().default(""),
    categoryId: trimmed(40).pipe(z.string().min(1, "Category is required.")),
    price: z
      .string()
      .max(20)
      .transform((value) => value.trim())
      .pipe(
        z
          .string()
          .regex(
            /^\d+(\.\d{1,2})?$/,
            "Price must be a number with up to 2 decimals.",
          ),
      )
      .transform((value) => Number.parseFloat(value))
      .pipe(
        z
          .number()
          .gt(0, "Price must be greater than 0.")
          .max(1_000_000, "Price is too large."),
      ),
    discountType: z.enum(["NONE", "PERCENT", "FIXED"]).default("NONE"),
    discountValue: z
      .string()
      .max(20)
      .transform((value) => value.trim())
      .optional()
      .default("")
      .transform((value) => {
        if (value.length === 0) return null;
        return Number.parseFloat(value);
      }),
    stock: z
      .string()
      .max(12)
      .transform((value) => value.trim())
      .pipe(z.string().regex(/^\d+$/, "Stock must be a whole number."))
      .transform((value) => Number.parseInt(value, 10))
      .pipe(
        z
          .number()
          .int()
          .min(0, "Stock cannot be negative.")
          .max(1_000_000, "Stock is too large."),
      ),
    isActive: z
      .string()
      .optional()
      .transform((value) => value === "on" || value === "true"),
    /** JSON string from the specs editor (array of `{ key, value }` pairs). */
    specsJson: z.string().max(20_000).optional().default(""),
  })
  .transform((data) => ({
    ...data,
    slug: slugify(data.name),
    description: data.description.length > 0 ? data.description : null,
    // Keep "discount active" derived from selected type + numeric value.
    isDiscountActive:
      data.discountType !== "NONE" &&
      data.discountValue !== null &&
      data.discountValue > 0,
  }))
  .superRefine((data, ctx) => {
    if (data.slug.length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["name"],
        message:
          "Name must contain at least 2 alphanumeric characters (used to build the URL).",
      });
    }

    if (data.discountType === "NONE") {
      if (data.discountValue !== null && data.discountValue > 0) {
        ctx.addIssue({
          code: "custom",
          path: ["discountType"],
          message: "Choose Fixed or Percentage when adding a discount value.",
        });
      }
      return;
    }

    if (data.discountValue === null || Number.isNaN(data.discountValue)) {
      ctx.addIssue({
        code: "custom",
        path: ["discountValue"],
        message: "Discounted price is required when discount type is selected.",
      });
      return;
    }

    if (data.discountValue <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["discountValue"],
        message: "Discount value must be greater than 0.",
      });
      return;
    }

    if (data.discountType === "PERCENT") {
      if (data.discountValue > 100) {
        ctx.addIssue({
          code: "custom",
          path: ["discountValue"],
          message: "Percentage discount cannot be more than 100.",
        });
      }
      return;
    }

    // FIXED
    if (data.discountValue > data.price) {
      ctx.addIssue({
        code: "custom",
        path: ["discountValue"],
        message: "Fixed discount cannot be more than product price.",
      });
    }
  });

export type AdminProductFormValues = z.output<typeof adminProductFormSchema>;

const specEntrySchema = z.object({
  key: trimmed(80).pipe(z.string().min(1, "Spec key is required.")),
  value: trimmed(500),
});

/**
 * Parses the JSON string from the specs editor into a plain `{ key: value }`
 * object suitable for Prisma's `Json?` column. Empty rows are dropped.
 */
export const parseSpecsJsonInput = (
  raw: string,
): Record<string, string> | null => {
  if (!raw || raw.trim().length === 0) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid specifications payload.");
  }
  if (!Array.isArray(parsed)) {
    throw new Error("Invalid specifications payload.");
  }
  const entries: Array<[string, string]> = [];
  const seenKeys = new Set<string>();
  for (const entry of parsed) {
    const validated = specEntrySchema.safeParse(entry);
    if (!validated.success) {
      throw new Error(
        validated.error.issues[0]?.message ?? "Invalid spec entry.",
      );
    }
    if (seenKeys.has(validated.data.key)) {
      throw new Error(`Duplicate spec key: ${validated.data.key}`);
    }
    seenKeys.add(validated.data.key);
    entries.push([validated.data.key, validated.data.value]);
  }
  if (entries.length === 0) return null;
  return Object.fromEntries(entries);
};
