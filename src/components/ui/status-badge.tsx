import type { ReactNode } from "react";

export type StatusBadgeTone =
  | "success"
  | "warning"
  | "danger"
  | "neutral"
  | "info";

const toneClassMap: Record<StatusBadgeTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  neutral: "border-neutral-200 bg-neutral-50 text-neutral-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
};

type StatusBadgeProps = {
  tone?: StatusBadgeTone;
  children: ReactNode;
  className?: string;
};

export const StatusBadge = ({
  tone = "neutral",
  children,
  className,
}: StatusBadgeProps) => (
  <span
    className={[
      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold",
      toneClassMap[tone],
      className ?? "",
    ]
      .filter(Boolean)
      .join(" ")}
  >
    {children}
  </span>
);
