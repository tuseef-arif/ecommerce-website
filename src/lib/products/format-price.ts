/**
 * Formats a numeric price for storefront display, e.g. `11,799` or `11,799.50`.
 * Hides decimals when the value is a clean integer to match the brand style
 * shown on cards (`Rs 14,999` rather than `Rs 14,999.00`).
 *
 * Pure / no `server-only` imports — safe to use in client components too.
 */
export const formatProductPriceAmount = (value: number): string => {
  if (!Number.isFinite(value)) return "0";
  const isWhole = Math.abs(value - Math.round(value)) < 0.005;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Combines the configured currency prefix with a formatted amount.
 * Caller passes the localised prefix (e.g. `Rs`) so this helper stays
 * white-label friendly.
 */
export const formatProductPriceWithPrefix = (
  value: number,
  prefix: string,
): string => `${prefix} ${formatProductPriceAmount(value)}`;
