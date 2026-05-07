/**
 * Plain, JSON-serializable shapes shared across server pages and client forms.
 * `Decimal` is converted to `string`; `Date` to ISO `string` for client safety.
 */

import type { ProductDiscountTypeValue } from "@/lib/products/discount";
import type { ProductVariantOption } from "@/lib/products/specs";

export type AdminProductSpecEntry = {
  key: string;
  value: string;
};

export type AdminProductListItem = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  imagePath: string | null;
  /** Decimal serialised as string (e.g. "699.00"). */
  price: string;
  /** Effective price after discounting, formatted with 2 decimals. */
  finalPrice: string;
  discountType: ProductDiscountTypeValue;
  discountValue: string | null;
  isDiscountActive: boolean;
  stock: number;
  isActive: boolean;
  category: { id: string; name: string; slug: string };
  updatedAtIso: string;
};

export type AdminProductDetail = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  model: string;
  description: string | null;
  imagePath: string | null;
  price: string;
  discountType: ProductDiscountTypeValue;
  discountValue: string | null;
  isDiscountActive: boolean;
  stock: number;
  isActive: boolean;
  isOnSale: boolean;
  isNewArrival: boolean;
  categoryId: string;
  specs: AdminProductSpecEntry[];
  /**
   * Admin-managed list of available colors. Each entry carries an optional
   * `priceDelta` (≥0) added to the product's base price when the shopper
   * picks that color. Legacy `string[]` data is auto-upgraded to deltas of 0.
   */
  colorOptions: ProductVariantOption[];
  /**
   * Admin-managed list of available storage variants (e.g. "128 GB"). Each
   * entry carries an optional `priceDelta` (≥0) so larger capacities can be
   * priced above the base.
   */
  storageOptions: ProductVariantOption[];
};

export type AdminProductCategoryOption = {
  id: string;
  name: string;
  slug: string;
};

export type AdminProductListPage = {
  items: AdminProductListItem[];
  totalCount: number;
  page: number;
  perPage: number;
  pageCount: number;
};

export type AdminProductsListFilters = {
  q: string;
  brand: string;
  category: string;
  status: "all" | "active" | "inactive";
  page: number;
};

/** Status banner echoed back into URL after a successful mutation. */
export type AdminProductsListStatus = "created" | "updated" | "deleted" | null;
