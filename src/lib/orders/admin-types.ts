/**
 * Plain, JSON-serialisable shapes for the admin Orders module. Mirrors the
 * conventions used by `src/lib/products/admin-types.ts` so the table, form,
 * and filter pieces stay consistent across modules.
 *
 * `Decimal` values are serialised as `string` (e.g. "699.00"); `Date` values
 * are serialised as ISO `string` for client-component safety.
 */

import type { OrderStatus, PaymentMethod } from "@/generated/prisma/enums";
import type { ProductVariantOption } from "@/lib/products/specs";

export type AdminOrderStatusFilter = "all" | OrderStatus;
export type AdminOrderPaymentMethodFilter = "all" | PaymentMethod;

export type AdminOrderListItem = {
  id: string;
  /** Short uppercased suffix for compact table cells (last 6 chars). */
  shortId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  itemsCount: number;
  /** Total quantity across all line items. */
  itemsQuantity: number;
  subtotal: string;
  discountAmount: string;
  totalAmount: string;
  customer: {
    id: string;
    email: string;
    displayName: string;
  };
  createdAtIso: string;
  updatedAtIso: string;
  shippedAtIso: string | null;
  deliveredAtIso: string | null;
};

export type AdminOrderItemDetail = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  discountPercent: string;
  /** Discounted unit price BEFORE variant deltas. */
  discountedPrice: string;
  /** Snapshot of the chosen color (e.g. "White"); null when N/A. */
  selectedColor: string | null;
  /** Snapshot of the chosen storage (e.g. "12 GB"); null when N/A. */
  selectedStorage: string | null;
  /** Per-unit upcharge from the selected color variant; "0.00" by default. */
  colorPriceDelta: string;
  /** Per-unit upcharge from the selected storage variant; "0.00" by default. */
  storagePriceDelta: string;
  /** `(discountedPrice + colorPriceDelta + storagePriceDelta) × quantity`. */
  lineTotal: string;
};

export type AdminOrderDetail = {
  id: string;
  shortId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  subtotal: string;
  discountAmount: string;
  /** Uppercase cart voucher code when a storefront voucher was applied. */
  voucherCode: string | null;
  voucherDiscountAmount: string;
  totalAmount: string;
  customer: {
    id: string;
    email: string;
    displayName: string;
  };
  items: AdminOrderItemDetail[];
  createdAtIso: string;
  updatedAtIso: string;
  shippedAtIso: string | null;
  deliveredAtIso: string | null;
};

export type AdminOrderListPage = {
  items: AdminOrderListItem[];
  totalCount: number;
  page: number;
  perPage: number;
  pageCount: number;
};

export type AdminOrdersListFilters = {
  q: string;
  status: AdminOrderStatusFilter;
  paymentMethod: AdminOrderPaymentMethodFilter;
  /** Inclusive lower bound, ISO date (YYYY-MM-DD). Empty when not filtered. */
  from: string;
  /** Inclusive upper bound, ISO date (YYYY-MM-DD). Empty when not filtered. */
  to: string;
  page: number;
};

export type AdminOrdersListStatus = "created" | "updated" | "deleted" | null;

export type AdminOrderProductOption = {
  id: string;
  name: string;
  brand: string;
  /** Decimal as string, with discount applied if active. */
  finalPrice: string;
  /** Effective discount percent, formatted as string with up to 2 decimals. */
  discountPercent: string;
  /** Effective discounted unit price (== finalPrice), kept for clarity. */
  discountedPrice: string;
  /** Original unit price before discount. */
  unitPrice: string;
  stock: number;
  isActive: boolean;
  /** Owning category — used by the order editor to narrow the product list. */
  category: {
    id: string;
    slug: string;
    name: string;
  };
  /**
   * Variant options the admin defined for this product. Each carries an
   * optional non-negative `priceDelta` added on top of `discountedPrice` when
   * the shopper picks that option. Empty arrays mean "no variants for this
   * field", in which case the order editor hides the corresponding dropdown.
   */
  colorOptions: ProductVariantOption[];
  storageOptions: ProductVariantOption[];
};

export type AdminOrderCustomerOption = {
  id: string;
  email: string;
  displayName: string;
};
