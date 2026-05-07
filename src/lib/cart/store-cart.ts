"use client";

export const STORE_CART_UPDATED_EVENT = "store-cart:updated";
const STORE_CART_STORAGE_KEY = "storefront-cart-v1";

export type StoreCartItem = {
  productId: string;
  name: string;
  href: string;
  imagePath: string | null;
  unitPrice: number;
  quantity: number;
  selectedColor: string | null;
  selectedStorage: string | null;
};
export type StoreCartItemInput = Omit<StoreCartItem, "quantity">;
type AddToCartOptions = {
  /** Max total quantity allowed in cart for this product (across variants). */
  maxAllowed: number;
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
      reason: "limit_reached";
      addedQuantity: 0;
      currentProductQuantity: number;
    };

const isBrowser = () => typeof window !== "undefined";

const itemKey = (
  item: Pick<StoreCartItem, "productId" | "selectedColor" | "selectedStorage">,
) =>
  `${item.productId}::${item.selectedColor ?? ""}::${item.selectedStorage ?? ""}`;

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
        typeof candidate.unitPrice === "number" &&
        Number.isFinite(candidate.unitPrice) &&
        typeof candidate.quantity === "number" &&
        Number.isInteger(candidate.quantity) &&
        candidate.quantity > 0 &&
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

export const getStoreCartCount = (items = readStoreCart()) =>
  items.reduce((sum, item) => sum + item.quantity, 0);

export const addItemToStoreCart = (
  item: StoreCartItemInput,
  quantity = 1,
  options?: AddToCartOptions,
): AddToStoreCartResult => {
  const safeQty = Math.max(1, Math.trunc(quantity));
  const items = readStoreCart();
  const maxAllowed = Math.max(
    1,
    Math.trunc(options?.maxAllowed ?? Number.POSITIVE_INFINITY),
  );
  const currentProductQuantity = items
    .filter((row) => row.productId === item.productId)
    .reduce((sum, row) => sum + row.quantity, 0);
  const remaining = Math.max(0, maxAllowed - currentProductQuantity);

  if (remaining <= 0) {
    return {
      ok: false,
      reason: "limit_reached",
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
      quantity: current.quantity + acceptedQuantity,
    };
    writeStoreCart(items);
    return {
      ok: true,
      addedQuantity: acceptedQuantity,
      currentProductQuantity: currentProductQuantity + acceptedQuantity,
      reachedLimit: currentProductQuantity + acceptedQuantity >= maxAllowed,
    };
  }
  const nextItem: StoreCartItem = { ...item, quantity: acceptedQuantity };
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
  const nextQty = Math.max(1, Math.min(10, Math.trunc(quantity)));
  const items = readStoreCart();
  const nextItems = items.map((row) =>
    itemKey(row) === itemKey(item) ? { ...row, quantity: nextQty } : row,
  );
  writeStoreCart(nextItems);
  return nextItems;
};
