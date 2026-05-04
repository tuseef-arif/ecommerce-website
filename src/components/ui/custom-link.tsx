import Link from "next/link";
import type { CustomLinkProps } from "@/lib/type/custom-link";

const isAppRouterPath = (href: string) =>
  href.startsWith("/") && !href.startsWith("//");

const isHttpUrl = (href: string) => /^https?:\/\//i.test(href);

const defaultVisibleLabel = (href: string): string => {
  const lower = href.toLowerCase();
  if (lower.startsWith("mailto:")) return href.slice("mailto:".length);
  if (lower.startsWith("tel:")) return href.slice("tel:".length);
  return href;
};

export type { CustomLinkProps } from "@/lib/type/custom-link";

export const CustomLink = ({
  href,
  children,
  className = "",
  variant = "default",
  external,
  target,
  rel,
  ...rest
}: CustomLinkProps) => {
  const variantClass =
    variant === "on-brand"
      ? "custom-link custom-link--on-brand"
      : "custom-link";
  const mergedClass = [variantClass, className].filter(Boolean).join(" ");
  const label = children ?? defaultVisibleLabel(href);

  if (isAppRouterPath(href)) {
    return (
      <Link href={href} className={mergedClass} {...rest}>
        {label}
      </Link>
    );
  }

  const openInNewTab = external ?? (isHttpUrl(href) ? true : false);
  const resolvedTarget =
    target !== undefined ? target : openInNewTab ? "_blank" : undefined;
  const resolvedRel =
    rel !== undefined
      ? rel
      : resolvedTarget === "_blank"
        ? "noopener noreferrer"
        : undefined;

  return (
    <a
      href={href}
      className={mergedClass}
      {...rest}
      target={resolvedTarget}
      rel={resolvedRel}
    >
      {label}
    </a>
  );
};
