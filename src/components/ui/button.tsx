import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "accent"
  | "danger"
  | "ghost";
export type ButtonSize = "sm" | "md";

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingLabel?: ReactNode;
  fullWidth?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const baseClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-[filter,background-color,color,border-color,box-shadow] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const sizeClassMap: Record<ButtonSize, string> = {
  sm: "min-h-8 px-3 text-xs",
  md: "min-h-10 px-4 text-sm",
};

const variantClassMap: Record<ButtonVariant, string> = {
  primary:
    "border border-transparent bg-[var(--store-brand-primary)] text-white shadow-sm hover:brightness-110 focus-visible:outline-[var(--store-brand-primary)]",
  secondary:
    "border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 focus-visible:outline-[var(--store-brand-primary)]",
  accent:
    "border border-transparent bg-[var(--store-brand-accent)] text-white shadow-sm hover:brightness-110 focus-visible:outline-[var(--store-brand-accent)]",
  danger:
    "border border-transparent bg-red-600 text-white shadow-sm hover:brightness-110 focus-visible:outline-red-700",
  ghost:
    "border border-transparent bg-transparent text-neutral-700 hover:bg-neutral-100 focus-visible:outline-[var(--store-brand-primary)]",
};

export const Button = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  loadingLabel,
  fullWidth = false,
  className,
  disabled,
  type = "button",
  children,
  ...rest
}: ButtonProps) => {
  const widthClass = fullWidth ? "w-full" : "";
  const classes = [
    baseClass,
    sizeClassMap[size],
    variantClassMap[variant],
    widthClass,
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || isLoading}
      className={classes}
      aria-busy={isLoading || undefined}
    >
      {isLoading ? (loadingLabel ?? children) : children}
    </button>
  );
};
