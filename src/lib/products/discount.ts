/**
 * Shared discount math used by both server data shaping and the admin form
 * preview. Kept free of `server-only` and Node imports so client components
 * (e.g. `ProductForm`) can reuse the same rules without bundling server code.
 *
 * Inputs are normalised to numbers; callers parse strings/Decimals at their
 * boundary. The "active" flag in {@link finalProductPrice} mirrors the DB
 * column so listings can be priced consistently with admin previews.
 */

export type ProductDiscountTypeValue = "NONE" | "PERCENT" | "FIXED";

type DiscountInput = {
  price: number;
  discountType: ProductDiscountTypeValue;
  /** `null` when no discount has been entered. */
  discountValue: number | null;
};

const applyDiscountToPrice = ({
  price,
  discountType,
  discountValue,
}: DiscountInput): number => {
  if (discountType === "NONE") return price;
  if (discountValue === null || discountValue <= 0) return price;
  if (discountType === "PERCENT") {
    const clampedPercent = Math.min(100, Math.max(0, discountValue));
    return Math.max(0, price - (price * clampedPercent) / 100);
  }
  return Math.max(0, price - discountValue);
};

/**
 * Final list price after applying the discount when it is active.
 * Falls back to the raw price for invalid prices or when discounting is off.
 */
export const finalProductPrice = (
  input: DiscountInput & { isDiscountActive: boolean },
): number => {
  if (!Number.isFinite(input.price) || input.price <= 0) return input.price;
  if (!input.isDiscountActive) return input.price;
  return applyDiscountToPrice(input);
};

/**
 * Live preview helper for the admin form. Treats the discount as if active so
 * editors see the effect of their input even before saving. Empty/invalid
 * inputs yield an empty string so the read-only preview stays blank.
 */
export const previewDiscountedPrice = (input: {
  priceRaw: string;
  discountType: ProductDiscountTypeValue;
  discountValueRaw: string;
}): string => {
  const price = Number.parseFloat(input.priceRaw);
  if (!Number.isFinite(price) || price <= 0) return "";

  const discountValueParsed = Number.parseFloat(input.discountValueRaw);
  const discountValue = Number.isFinite(discountValueParsed)
    ? discountValueParsed
    : null;

  return applyDiscountToPrice({
    price,
    discountType: input.discountType,
    discountValue,
  }).toFixed(2);
};
