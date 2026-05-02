"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useRef } from "react";
import {
  accountPopoverCloseButtonClass,
  submitClass,
} from "@/components/store/account-popover-styles";
import { IconCheckCircleFilled, IconX } from "@/components/icons";
import { STORE_AUTH_SUCCESS_ELEMENT_ID } from "@/components/store/account-popover-constants";
import { SITE_HEADER } from "@/lib/config/site-config";
import { THREE_SECOND_TIMEOUT_MS } from "@/lib/constants/ui-timeouts";

export type StoreAuthSuccessDialogProps = {
  isOpen: boolean;
  /** Called when the user presses Ok, the X control, Escape, or the backdrop. */
  onDismiss: () => void;
  /** @default SITE_HEADER.accountAuthSuccessTitle */
  title?: string;
  /** @default SITE_HEADER.accountAuthSuccessMessage */
  message?: string;
  /** @default SITE_HEADER.accountAuthSuccessOk */
  okLabel?: string;
  /**
   * Visual beside the title: green check (login/register) or waving hand (logout).
   * @default "check"
   */
  titleAccent?: "check" | "wave";
};

const cardSurfaceClass =
  "rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-900 shadow-lg ring-1 ring-black/5 md:p-8";

/**
 * Centered confirmation after auth (e.g. login) or logout. Navy headline + green tick
 * or wave emoji, orange body copy, primary-styled Ok, and the same close control as the account sheet.
 */
export const StoreAuthSuccessDialog = ({
  isOpen,
  onDismiss,
  title = SITE_HEADER.accountAuthSuccessTitle,
  message = SITE_HEADER.accountAuthSuccessMessage,
  okLabel = SITE_HEADER.accountAuthSuccessOk,
  titleAccent = "check",
}: StoreAuthSuccessDialogProps) => {
  const titleId = useId();
  const messageId = useId();
  const okRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onDismiss();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onDismiss]);

  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => okRef.current?.focus());
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const timerId = window.setTimeout(() => {
      onDismiss();
    }, THREE_SECOND_TIMEOUT_MS);
    return () => window.clearTimeout(timerId);
  }, [isOpen, onDismiss]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      id={STORE_AUTH_SUCCESS_ELEMENT_ID}
      className="fixed inset-0 z-[80]"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 transition-opacity"
        aria-label={SITE_HEADER.accountAuthSuccessBackdropAria}
        onClick={onDismiss}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 py-[max(1rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto w-full max-w-sm">
          <div
            role="dialog"
            aria-modal
            aria-labelledby={titleId}
            aria-describedby={messageId}
            tabIndex={-1}
            className={`relative outline-none ${cardSurfaceClass}`.trim()}
          >
            <button
              type="button"
              className={accountPopoverCloseButtonClass}
              aria-label={SITE_HEADER.accountSheetCloseAria}
              onClick={onDismiss}
            >
              <IconX
                width={18}
                height={18}
                className="shrink-0"
                strokeWidth={2.5}
              />
            </button>

            <div className="flex flex-col items-center px-2 pb-1 pt-6 text-center sm:px-4">
              <div className="flex items-center justify-center gap-2.5">
                <h2
                  id={titleId}
                  className="text-xl font-extrabold text-[var(--store-brand-primary)] md:text-2xl"
                >
                  {title}
                </h2>
                {titleAccent === "check" ? (
                  <span className="inline-flex shrink-0 text-emerald-600">
                    <IconCheckCircleFilled className="size-7 md:size-8" />
                  </span>
                ) : (
                  <span
                    className="inline-flex shrink-0 text-[2rem] leading-none md:text-4xl"
                    role="img"
                    aria-label={SITE_HEADER.accountLogoutSuccessEmojiAria}
                  >
                    👋
                  </span>
                )}
              </div>

              <p
                id={messageId}
                className="mt-4 max-w-xs text-sm font-semibold text-[var(--store-brand-accent)] md:text-base"
              >
                {message}
              </p>

              <button
                ref={okRef}
                type="button"
                className={`${submitClass} mt-8`}
                onClick={onDismiss}
              >
                {okLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
