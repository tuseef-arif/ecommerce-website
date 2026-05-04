"use client";

import Link from "next/link";
import { IconX } from "@/components/icons";
import { SITE_HEADER, SITE_ROUTES } from "@/lib/config/site-config";

/** Primary CTA — solid fill (e.g. Login in drawer header) */
const guestAuthPrimaryClass =
  "inline-flex min-h-9 flex-1 items-center justify-center rounded-lg bg-white px-2 text-center text-xs font-semibold text-[var(--store-brand-primary)] shadow-sm transition-colors hover:bg-white/95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/** Secondary CTA — outline on gradient (e.g. Sign up) */
const guestAuthSecondaryClass =
  "inline-flex min-h-9 flex-1 items-center justify-center rounded-lg border border-white/50 bg-transparent px-2 text-center text-xs font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export type StoreDrawerGuestAuthButtonsProps = {
  /** Called after tap (e.g. close drawer + account popover) */
  onAfterNavigate?: () => void;
};

/**
 * Login + Sign up row for the mobile drawer header — copy and routes from `SITE_HEADER` / `SITE_ROUTES`.
 */
export const StoreDrawerGuestAuthButtons = ({
  onAfterNavigate,
}: StoreDrawerGuestAuthButtonsProps) => {
  const handle = () => {
    onAfterNavigate?.();
  };

  return (
    <div className="mt-2 flex flex-row gap-2">
      <Link
        href={SITE_ROUTES.login}
        className={guestAuthPrimaryClass}
        onClick={handle}
      >
        {SITE_HEADER.loginCta}
      </Link>
      <Link
        href={SITE_ROUTES.register}
        className={guestAuthSecondaryClass}
        onClick={handle}
      >
        {SITE_HEADER.mobileNavSignUpCta}
      </Link>
    </div>
  );
};

export type StoreDrawerCloseButtonProps = {
  onClick: () => void;
  /** Extra positioning / layout classes */
  className?: string;
};

/**
 * Drawer close control — transparent hit area, white X (no white circle).
 */
export const StoreDrawerCloseButton = ({
  onClick,
  className = "",
}: StoreDrawerCloseButtonProps) => (
  <button
    type="button"
    className={`absolute right-2 top-2 z-[1] inline-flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-3 sm:top-2 ${className}`.trim()}
    aria-label={SITE_HEADER.mobileNavCloseAria}
    onClick={onClick}
  >
    <IconX className="h-4 w-4" strokeWidth={2.5} />
  </button>
);
