import type { LinkProps } from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type StoreBrandTextLinkSize = "sm" | "base";

type CommonProps = {
  children: ReactNode;
  className?: string;
  /** @default "sm" */
  size?: StoreBrandTextLinkSize;
};

export type StoreBrandTextLinkAsLinkProps = CommonProps &
  Omit<LinkProps, "className" | "children"> & {
    href: LinkProps["href"];
  };

export type StoreBrandTextLinkAsButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
  };

export type StoreBrandTextLinkProps =
  | StoreBrandTextLinkAsLinkProps
  | StoreBrandTextLinkAsButtonProps;
