"use client";

import { useRef, useState } from "react";

export const ADDED_LABEL = "Added";
export const LIMIT_REACHED_LABEL = "Product limit reached";
export const ADDED_STATE_TIMEOUT_MS = 1100;
export const ADDED_BUTTON_CLASS =
  "scale-[1.02] border-[#fe9922] bg-[#fe9922] hover:brightness-105 focus-visible:outline-[#fe9922]";

/**
 * Reusable transient "Added" feedback state for add-to-cart CTAs.
 */
export const useAddToCartFeedback = () => {
  const [status, setStatus] = useState<"idle" | "added" | "limit_reached">(
    "idle",
  );
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

  return {
    status,
    isAdded: status === "added",
    showAdded,
    showLimitReached,
  };
};
