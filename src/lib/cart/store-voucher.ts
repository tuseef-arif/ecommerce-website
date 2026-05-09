"use client";

export const STORE_VOUCHER_UPDATED_EVENT = "store-voucher:updated";

const STORE_VOUCHER_STORAGE_KEY = "storefront-voucher-v1";

const isBrowser = () => typeof window !== "undefined";

export const readStoreVoucherCode = (): string | null => {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORE_VOUCHER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const code = (parsed as { code?: unknown }).code;
    if (typeof code !== "string") return null;
    const trimmed = code.trim().toUpperCase();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
};

export const setStoreVoucherCode = (code: string): void => {
  if (!isBrowser()) return;
  const normalized = code.trim().toUpperCase();
  if (normalized.length === 0) {
    clearStoreVoucherCode();
    return;
  }
  window.localStorage.setItem(
    STORE_VOUCHER_STORAGE_KEY,
    JSON.stringify({ code: normalized }),
  );
  window.dispatchEvent(new CustomEvent(STORE_VOUCHER_UPDATED_EVENT));
};

export const clearStoreVoucherCode = (): void => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORE_VOUCHER_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(STORE_VOUCHER_UPDATED_EVENT));
};
