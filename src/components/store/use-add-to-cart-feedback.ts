"use client";

import { useRef, useState } from "react";

export const ADDED_LABEL = "Added";
export const LIMIT_REACHED_LABEL = "Limit reached";
export const OUT_OF_STOCK_LABEL = "Out of stock";
export const ADDED_STATE_TIMEOUT_MS = 1100;
export const ADDED_BUTTON_CLASS =
  "scale-[1.02] border-[#fe9922] bg-[#fe9922] hover:brightness-105 focus-visible:outline-[#fe9922]";

/**
 * Reusable transient "Added" feedback state for add-to-cart CTAs.
 */
export const useAddToCartFeedback = () => {
  const [status, setStatus] = useState<
    "idle" | "added" | "limit_reached" | "out_of_stock"
  >("idle");
  const timeoutRef = useRef<number | null>(null);

  const scheduleReset = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setStatus("idle");
      timeoutRef.current = null;
    }, ADDED_STATE_TIMEOUT_MS);
  };

  const showAdded = () => {
    setStatus("added");
    scheduleReset();
  };

  const showLimitReached = () => {
    setStatus("limit_reached");
    scheduleReset();
  };

  const showOutOfStock = () => {
    setStatus("out_of_stock");
    scheduleReset();
  };

  return {
    status,
    isAdded: status === "added",
    showAdded,
    showLimitReached,
    showOutOfStock,
  };
};
