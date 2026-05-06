/**
 * JSON-safe shapes used by storefront (public) product UI.
 * Decimals are converted to numbers at the data boundary so client components
 * (e.g. `ProductSlider`) never see Prisma `Decimal` instances.
 */

import type { ProductSpecEntry } from "@/lib/products/specs";

export type StorefrontProductCardItem = {
  id: string;
  name: string;
  brand: string;
  slug: string;
  href: string;
  /** Same-origin path or absolute URL; already validated by `safeProductImageSrc`. */
  imagePath: string | null;
  /** Original list price, in store currency units (e.g. PKR). */
  price: number;
  /**
   * Final price after applying any active discount. Equal to `price` when no
   * discount is active; cards use the strict `<` comparison to decide whether
   * to show the strikethrough.
   */
  finalPrice: number;
  /**
   * Pre-formatted discount badge label, e.g. `"25% OFF"` or `"Rs 5,000 OFF"`.
   * `null` when no discount is active or the discount value is zero. Computed
   * server-side so the card stays presentational and translation-friendly.
   */
  discountLabel: string | null;
};

/**
 * Full product detail shape used by `/products/[slug]`.
 * Extends the card item with description, specs, and category info so the
 * detail view + related rail share the same primitives.
 */
export type StorefrontProductDetail = StorefrontProductCardItem & {
  brand: string;
  model: string;
  productType: string;
  description: string | null;
  stock: number;
  /** Whether stock is positive — used to flip the "In stock" / "Out of stock" pill. */
  isInStock: boolean;
  category: {
    id: string;
    slug: string;
    name: string;
  };
  specs: ProductSpecEntry[];
  keyFeatures: string[];
  colorOptions: string[];
  /** Admin-managed list of storage variants (e.g. "128 GB"). */
  storageOptions: string[];
};
