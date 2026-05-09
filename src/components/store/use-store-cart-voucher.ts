"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { previewCartVoucherAction } from "@/app/(shop)/actions";
import {
  STORE_VOUCHER_UPDATED_EVENT,
  clearStoreVoucherCode,
  readStoreVoucherCode,
  setStoreVoucherCode,
} from "@/lib/cart/store-voucher";

export type StoreCartVoucherPreview = {
  amount: number;
  code: string;
  name: string;
};

export type StoreCartVoucherMessage = {
  type: "success" | "error";
  text: string;
};

const applySuccessCopy = (
  name: string,
  variant: "cart" | "checkout",
): string =>
  variant === "cart" ? `“${name}” applied to your cart.` : `“${name}” applied.`;

type UseStoreCartVoucherOptions = {
  /** Cart net subtotal after product-level discounts (matches checkout server logic). */
  cartNetSubtotal: number;
  applySuccessVariant?: "cart" | "checkout";
};

export const useStoreCartVoucher = ({
  cartNetSubtotal,
  applySuccessVariant = "checkout",
}: UseStoreCartVoucherOptions) => {
  const [discountVoucher, setDiscountVoucher] = useState("");
  const [savedVoucherCode, setSavedVoucherCode] = useState<string | null>(null);
  /** Fetched preview for `savedVoucherCode`; UI uses `voucherPreview` which is null when no code. */
  const [fetchedPreview, setFetchedPreview] =
    useState<StoreCartVoucherPreview | null>(null);
  const voucherPreview =
    savedVoucherCode !== null &&
    fetchedPreview !== null &&
    fetchedPreview.code === savedVoucherCode
      ? fetchedPreview
      : null;
  const [voucherMessage, setVoucherMessage] =
    useState<StoreCartVoucherMessage | null>(null);
  const [isVoucherPending, startVoucherTransition] = useTransition();

  useEffect(() => {
    const syncVoucher = () => {
      const code = readStoreVoucherCode();
      setSavedVoucherCode(code);
      setDiscountVoucher(code ?? "");
    };
    syncVoucher();
    window.addEventListener(STORE_VOUCHER_UPDATED_EVENT, syncVoucher);
    return () =>
      window.removeEventListener(STORE_VOUCHER_UPDATED_EVENT, syncVoucher);
  }, []);

  useEffect(() => {
    if (!savedVoucherCode) return;
    let cancelled = false;
    void (async () => {
      const result = await previewCartVoucherAction({
        code: savedVoucherCode,
        cartNetSubtotal,
      });
      if (cancelled) return;
      if (result.ok) {
        setFetchedPreview({
          amount: result.appliedAmount,
          code: result.code,
          name: result.name,
        });
        setVoucherMessage(null);
      } else {
        setFetchedPreview(null);
        clearStoreVoucherCode();
        setSavedVoucherCode(null);
        setVoucherMessage({ type: "error", text: result.error });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [savedVoucherCode, cartNetSubtotal]);

  const handleApplyVoucher = useCallback(() => {
    setVoucherMessage(null);
    startVoucherTransition(async () => {
      const trimmed = discountVoucher.trim();
      if (!trimmed) {
        setVoucherMessage({ type: "error", text: "Enter a voucher code." });
        return;
      }
      const result = await previewCartVoucherAction({
        code: trimmed,
        cartNetSubtotal,
      });
      if (!result.ok) {
        setVoucherMessage({ type: "error", text: result.error });
        return;
      }
      setStoreVoucherCode(result.code);
      setSavedVoucherCode(result.code);
      setDiscountVoucher(result.code);
      setFetchedPreview({
        amount: result.appliedAmount,
        code: result.code,
        name: result.name,
      });
      setVoucherMessage({
        type: "success",
        text: applySuccessCopy(result.name, applySuccessVariant),
      });
    });
  }, [discountVoucher, cartNetSubtotal, applySuccessVariant]);

  const handleRemoveVoucher = useCallback(() => {
    clearStoreVoucherCode();
    setSavedVoucherCode(null);
    setDiscountVoucher("");
    setFetchedPreview(null);
    setVoucherMessage(null);
  }, []);

  const voucherSavings = voucherPreview?.amount ?? 0;

  return {
    discountVoucher,
    setDiscountVoucher,
    voucherPreview,
    voucherMessage,
    isVoucherPending,
    handleApplyVoucher,
    handleRemoveVoucher,
    voucherSavings,
  };
};
