"use client";

import { clearStoreVoucherCode } from "@/lib/cart/store-voucher";

export const STORE_CART_UPDATED_EVENT = "store-cart:updated";
const STORE_CART_STORAGE_KEY = "storefront-cart-v1";

export type StoreCartItem = {
  productId: string;
  name: string;
  href: string;
  imagePath: string | null;
  /** Original per-unit price before discount, when available. */
  originalUnitPrice?: number;
  unitPrice: number;
  quantity: number;
  /** Max total quantity allowed for this product across all variants. */
  maxAllowed?: number;
  selectedColor: string | null;
  selectedStorage: string | null;
};
export type StoreCartItemInput = Omit<StoreCartItem, "quantity">;
type AddToCartOptions = {
  /** Max quantity per user for this product (across variants). */
  maxPerUser: number;
  /** Current stock available for this product. */
  stockAvailable: number;
};

export type AddToStoreCartResult =
  | {
      ok: true;
      addedQuantity: number;
      currentProductQuantity: number;
      reachedLimit: boolean;
    }
  | {
      ok: false;
      reason: "limit_reached" | "out_of_stock";
      addedQuantity: 0;
      currentProductQuantity: number;
    };

const isBrowser = () => typeof window !== "undefined";

const itemKey = (
  item: Pick<StoreCartItem, "productId" | "selectedColor" | "selectedStorage">,
) =>
  `${item.productId}::${item.selectedColor ?? ""}::${item.selectedStorage ?? ""}`;

const normalizeMaxAllowed = (
  value: number | undefined,
  fallback = 10,
): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(1, Math.trunc(value));
};

const getProductLimit = (
  items: ReadonlyArray<StoreCartItem>,
  productId: string,
): number => {
  const limits = items
    .filter((row) => row.productId === productId)
    .map((row) => normalizeMaxAllowed(row.maxAllowed, 10));
  if (limits.length === 0) return 10;
  // Use the smallest known cap to avoid overselling when variants disagree.
  return Math.min(...limits);
};

export const readStoreCart = (): StoreCartItem[] => {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORE_CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((row): row is StoreCartItem => {
      if (!row || typeof row !== "object") return false;
      const candidate = row as Partial<StoreCartItem>;
      return (
        typeof candidate.productId === "string" &&
        typeof candidate.name === "string" &&
        typeof candidate.href === "string" &&
        (typeof candidate.imagePath === "string" ||
          candidate.imagePath === null) &&
        (typeof candidate.originalUnitPrice === "number"
          ? Number.isFinite(candidate.originalUnitPrice)
          : candidate.originalUnitPrice === undefined) &&
        typeof candidate.unitPrice === "number" &&
        Number.isFinite(candidate.unitPrice) &&
        typeof candidate.quantity === "number" &&
        Number.isInteger(candidate.quantity) &&
        candidate.quantity > 0 &&
        (typeof candidate.maxAllowed === "number"
          ? Number.isInteger(candidate.maxAllowed) && candidate.maxAllowed > 0
          : candidate.maxAllowed === undefined) &&
        (typeof candidate.selectedColor === "string" ||
          candidate.selectedColor === null) &&
        (typeof candidate.selectedStorage === "string" ||
          candidate.selectedStorage === null)
      );
    });
  } catch {
    return [];
  }
};

const writeStoreCart = (items: StoreCartItem[]) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORE_CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(STORE_CART_UPDATED_EVENT));
};

export const clearStoreCart = () => {
  writeStoreCart([]);
  clearStoreVoucherCode();
  return [];
};

export const getStoreCartCount = (items = readStoreCart()) =>
  items.reduce((sum, item) => sum + item.quantity, 0);

export const addItemToStoreCart = (
  item: StoreCartItemInput,
  quantity = 1,
  options?: AddToCartOptions,
): AddToStoreCartResult => {
  const safeQty = Math.max(1, Math.trunc(quantity));
  const items = readStoreCart();
  const maxPerUser = Math.max(1, Math.trunc(options?.maxPerUser ?? 10));
  const stockAvailable = Math.max(
    0,
    Math.trunc(options?.stockAvailable ?? Number.POSITIVE_INFINITY),
  );
  const maxAllowed = Math.max(1, Math.min(maxPerUser, stockAvailable));
  const currentProductQuantity = items
    .filter((row) => row.productId === item.productId)
    .reduce((sum, row) => sum + row.quantity, 0);
  const remainingByUser = Math.max(0, maxPerUser - currentProductQuantity);
  const remainingByStock = Math.max(0, stockAvailable - currentProductQuantity);
  const remaining = Math.max(0, Math.min(remainingByUser, remainingByStock));

  if (remaining <= 0) {
    const reason =
      remainingByStock <= 0 && remainingByUser <= 0
        ? maxPerUser <= stockAvailable
          ? "limit_reached"
          : "out_of_stock"
        : remainingByStock <= 0
          ? "out_of_stock"
          : "limit_reached";
    return {
      ok: false,
      reason,
      addedQuantity: 0,
      currentProductQuantity,
    };
  }

  const acceptedQuantity = Math.min(safeQty, remaining);
  const key = itemKey(item);
  const existingIdx = items.findIndex((row) => itemKey(row) === key);
  if (existingIdx >= 0) {
    const current = items[existingIdx]!;
    items[existingIdx] = {
      ...current,
      originalUnitPrice:
        typeof item.originalUnitPrice === "number"
          ? item.originalUnitPrice
          : current.originalUnitPrice,
      quantity: current.quantity + acceptedQuantity,
      maxAllowed: Math.min(
        normalizeMaxAllowed(current.maxAllowed, maxAllowed),
        maxAllowed,
      ),
    };
    writeStoreCart(items);
    return {
      ok: true,
      addedQuantity: acceptedQuantity,
      currentProductQuantity: currentProductQuantity + acceptedQuantity,
      reachedLimit: currentProductQuantity + acceptedQuantity >= maxAllowed,
    };
  }
  const nextItem: StoreCartItem = {
    ...item,
    quantity: acceptedQuantity,
    maxAllowed,
  };
  writeStoreCart([...items, nextItem]);
  return {
    ok: true,
    addedQuantity: acceptedQuantity,
    currentProductQuantity: currentProductQuantity + acceptedQuantity,
    reachedLimit: currentProductQuantity + acceptedQuantity >= maxAllowed,
  };
};

export const removeItemFromStoreCart = (
  item: Pick<StoreCartItem, "productId" | "selectedColor" | "selectedStorage">,
) => {
  const items = readStoreCart();
  const nextItems = items.filter((row) => itemKey(row) !== itemKey(item));
  writeStoreCart(nextItems);
  return nextItems;
};

export const setStoreCartItemQuantity = (
  item: Pick<StoreCartItem, "productId" | "selectedColor" | "selectedStorage">,
  quantity: number,
) => {
  const items = readStoreCart();
  const target = items.find((row) => itemKey(row) === itemKey(item));
  if (!target) return items;

  const productLimit = getProductLimit(items, item.productId);
  const quantityUsedByOtherVariants = items
    .filter(
      (row) =>
        row.productId === item.productId && itemKey(row) !== itemKey(target),
    )
    .reduce((sum, row) => sum + row.quantity, 0);
  const maxForThisLine = Math.max(
    1,
    productLimit - quantityUsedByOtherVariants,
  );
  const nextQty = Math.max(1, Math.min(maxForThisLine, Math.trunc(quantity)));

  const nextItems = items.map((row) =>
    itemKey(row) === itemKey(item)
      ? { ...row, quantity: nextQty, maxAllowed: productLimit }
      : row,
  );
  writeStoreCart(nextItems);
  return nextItems;
};

export const getStoreCartItemMaxQuantity = (
  item: Pick<StoreCartItem, "productId" | "selectedColor" | "selectedStorage">,
  items = readStoreCart(),
): number => {
  const target = items.find((row) => itemKey(row) === itemKey(item));
  if (!target) return 10;
  const productLimit = getProductLimit(items, item.productId);
  const quantityUsedByOtherVariants = items
    .filter(
      (row) =>
        row.productId === item.productId && itemKey(row) !== itemKey(target),
    )
    .reduce((sum, row) => sum + row.quantity, 0);
  return Math.max(1, productLimit - quantityUsedByOtherVariants);
};
