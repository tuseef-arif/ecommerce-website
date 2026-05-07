/**
 * Converts backend-style category values (e.g. `smart-watches`) into
 * frontend labels (e.g. `Smart Watches`).
 */
export const formatCategoryLabel = (raw: string): string =>
  raw
    .trim()
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
