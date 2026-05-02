import Link from "next/link";
import type {
  StoreBrandTextLinkAsButtonProps,
  StoreBrandTextLinkAsLinkProps,
  StoreBrandTextLinkProps,
  StoreBrandTextLinkSize,
} from "@/lib/type/store-brand-text-link";

const storeBrandTextLinkVisualClass =
  "font-semibold text-[var(--store-brand-primary)] underline-offset-2 transition-colors hover:text-[var(--store-brand-accent)] hover:underline focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]";

const storeBrandTextLinkButtonResetClass =
  "inline shrink-0 cursor-pointer border-0 bg-transparent p-0";

const sizeClassName = (size: StoreBrandTextLinkSize | undefined) =>
  size === "base" ? "text-base" : "text-sm";

const mergeClass = (
  size: StoreBrandTextLinkSize | undefined,
  className: string | undefined,
) =>
  [storeBrandTextLinkVisualClass, sizeClassName(size), className]
    .filter(Boolean)
    .join(" ")
    .trim();

export type {
  StoreBrandTextLinkAsButtonProps,
  StoreBrandTextLinkAsLinkProps,
  StoreBrandTextLinkProps,
  StoreBrandTextLinkSize,
} from "@/lib/type/store-brand-text-link";

/**
 * Navy inline action with orange hover — use for Sign Up / Log In / Forgot password
 * and other store auth cross-links. Renders `Link` when `href` is set, otherwise `button`.
 */
export const StoreBrandTextLink = (props: StoreBrandTextLinkProps) => {
  if ("href" in props && props.href !== undefined && props.href !== "") {
    const { href, children, className, size, ...linkRest } =
      props as StoreBrandTextLinkAsLinkProps;
    return (
      <Link href={href} className={mergeClass(size, className)} {...linkRest}>
        {children}
      </Link>
    );
  }

  const {
    children,
    className,
    size,
    type = "button",
    ...buttonRest
  } = props as StoreBrandTextLinkAsButtonProps;
  return (
    <button
      type={type}
      className={`${storeBrandTextLinkButtonResetClass} ${mergeClass(size, className)}`.trim()}
      {...buttonRest}
    >
      {children}
    </button>
  );
};
