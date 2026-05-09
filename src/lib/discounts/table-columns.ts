/**
 * Admin discounts listing: column metadata (labels + layout hints).
 * Keep in sync with `DiscountTable` markup.
 */
export const ADMIN_DISCOUNT_TABLE_COLUMNS = [
  { id: "edit", label: "Edit", widthClass: "", srOnly: true as const },
  { id: "name", label: "Name", widthClass: "w-[14%]" },
  { id: "code", label: "Code", widthClass: "w-[10%]" },
  { id: "type", label: "Type", widthClass: "w-[10%]" },
  {
    id: "value",
    label: "Value",
    widthClass: "w-[10%]",
    align: "right" as const,
  },
  {
    id: "minOrder",
    label: "Min. order",
    widthClass: "w-[11%]",
    align: "right" as const,
  },
  {
    id: "maxDiscount",
    label: "Max. discount",
    widthClass: "w-[11%]",
    align: "right" as const,
  },
  { id: "start", label: "Start", widthClass: "w-[9%]" },
  { id: "end", label: "End", widthClass: "w-[9%]" },
  { id: "status", label: "Status", widthClass: "w-[8%]" },
  {
    id: "actions",
    label: "Actions",
    widthClass: "w-[8%]",
    align: "right" as const,
  },
] as const;
