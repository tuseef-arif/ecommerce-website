import type { SelectFieldOption } from "@/components/ui/select-field";

/** Prisma `DiscountType` values — used in forms, URLs, and Zod. */
export const DISCOUNT_TYPE_VALUES = ["FIXED", "PERCENTAGE"] as const;

export type DiscountTypeValue = (typeof DISCOUNT_TYPE_VALUES)[number];

export const ADMIN_DISCOUNT_TYPE_FORM_OPTIONS: ReadonlyArray<SelectFieldOption> =
  [
    { value: "FIXED", label: "Fixed" },
    { value: "PERCENTAGE", label: "Percentage" },
  ];

export const discountTypeLabel = (type: DiscountTypeValue): string =>
  type === "FIXED" ? "Fixed" : "Percentage";
