/**
 * Shared, framework-free helpers for the product `specs` JSON column.
 * Used by admin (edit form preview) and storefront (detail page) so both
 * surfaces apply the same defensive parse rules.
 */

export type ProductSpecEntry = {
  key: string;
  value: string;
};

const MAX_SPEC_ENTRIES = 200;
const MAX_KEY_LEN = 200;
const MAX_VALUE_LEN = 2_000;

/**
 * Coerce an unknown JSON-shaped value into a flat list of `{ key, value }`
 * rows. Anything that isn't a plain object is treated as empty so callers
 * never have to defensively `try/catch` around malformed catalog data.
 *
 * - Drops empty/whitespace keys.
 * - Stringifies primitive (non-string) values; serialises objects with
 *   `JSON.stringify` so the row stays renderable.
 * - Truncates very long entries to keep the DOM bounded.
 */
export const specsJsonToEntries = (specs: unknown): ProductSpecEntry[] => {
  if (!specs || typeof specs !== "object" || Array.isArray(specs)) return [];

  const entries: ProductSpecEntry[] = [];

  for (const [rawKey, rawValue] of Object.entries(
    specs as Record<string, unknown>,
  )) {
    if (typeof rawKey !== "string") continue;
    const key = rawKey.trim().slice(0, MAX_KEY_LEN);
    if (key.length === 0) continue;

    let value: string;
    if (typeof rawValue === "string") {
      value = rawValue;
    } else if (typeof rawValue === "number" || typeof rawValue === "boolean") {
      value = String(rawValue);
    } else if (rawValue === null || rawValue === undefined) {
      value = "";
    } else {
      try {
        value = JSON.stringify(rawValue);
      } catch {
        continue;
      }
    }

    entries.push({ key, value: value.slice(0, MAX_VALUE_LEN) });
    if (entries.length >= MAX_SPEC_ENTRIES) break;
  }

  return entries;
};

/**
 * Same defensive treatment for `keyFeatures` (expected to be `string[]`).
 * Returns `[]` for any other shape so the detail view can `if (length > 0)`
 * without exception handling.
 */
export const keyFeaturesJsonToList = (raw: unknown): string[] => {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const value of raw) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed.length === 0) continue;
    out.push(trimmed.slice(0, MAX_VALUE_LEN));
    if (out.length >= MAX_SPEC_ENTRIES) break;
  }
  return out;
};

/**
 * Same defensive treatment for `colorOptions` (expected to be `string[]`).
 * Color values may be names (`"Midnight Black"`) or hex codes (`"#0a0a0a"`).
 */
export const colorOptionsJsonToList = (raw: unknown): string[] =>
  keyFeaturesJsonToList(raw);

/**
 * Same defensive treatment for `storageOptions` (expected to be `string[]`).
 * Free-text values (`"64 GB"`, `"128 GB"`, `"1 TB"`) — the storefront just
 * lists them in a dropdown.
 */
export const storageOptionsJsonToList = (raw: unknown): string[] =>
  keyFeaturesJsonToList(raw);
