/** Shared Tailwind class strings for account popover shell + guest forms */

const submitVisualClass =
  "flex min-h-10 items-center justify-center rounded-lg bg-[var(--store-brand-primary)] px-3 py-2 text-sm font-semibold text-white shadow-sm transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)] disabled:cursor-not-allowed disabled:opacity-60";

export const submitClass =
  `mx-auto w-3/4 max-w-full ${submitVisualClass}`.trim();

/** Same as login primary button, full width (e.g. edit-profile form under inputs). */
export const submitFullWidthClass =
  `w-full max-w-full ${submitVisualClass}`.trim();

export const guestAuthDialogHeadingClass =
  "text-center text-lg font-extrabold text-[var(--store-brand-primary)]";

export const guestAuthDialogSubtitleClass =
  "mt-2 text-center text-sm font-medium text-[var(--store-brand-accent)]";

export const guestAuthFormClass = "mt-4 space-y-3.5";

export const authCrossFooterClass =
  "mt-5 w-full border-t border-neutral-100 pt-4 text-center";

const googleLoginBtnVisualClass =
  "flex min-h-10 items-center justify-center gap-2.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-[var(--store-brand-primary)] transition-colors hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]";

export const googleLoginBtnClass =
  `mx-auto w-3/4 max-w-full ${googleLoginBtnVisualClass}`.trim();

/** Same as login secondary / Google row, full width (e.g. edit-profile Cancel). */
export const googleLoginBtnFullWidthClass =
  `w-full max-w-full ${googleLoginBtnVisualClass}`.trim();

export const accountPopoverCloseButtonClass =
  "pointer-events-auto absolute right-2 top-2 z-30 flex size-10 shrink-0 items-center justify-center rounded-full border-0 bg-white text-[var(--store-brand-primary)] outline-none ring-0 transition-[color,background-color,box-shadow] hover:bg-neutral-50 hover:ring-1 hover:ring-inset hover:ring-neutral-300 focus-visible:ring-2 focus-visible:ring-[var(--store-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:right-3 sm:top-3 md:right-4 md:top-4 [&_svg]:text-[var(--store-brand-primary)] [&_svg]:stroke-[var(--store-brand-primary)]";
