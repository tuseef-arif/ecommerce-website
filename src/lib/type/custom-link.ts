import type { AnchorHTMLAttributes, ReactNode } from "react";

export type CustomLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "children"
> & {
  href: string;
  children?: ReactNode;
  /** `default`: page body (underline + brand hover). `on-brand`: footer / primary backgrounds. */
  variant?: "default" | "on-brand";
  /**
   * New tab for `http(s)` links. Defaults to `true` for http(s), `false` for `mailto:`, `tel:`, etc.
   */
  external?: boolean;
};
