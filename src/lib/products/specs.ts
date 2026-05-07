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
 * A single color/storage variant option. `priceDelta` is the additional cost,
 * in store currency units, that gets added to the product's base price when
 * the shopper selects this option. `0` means "base price".
 *
 * Stored on the `Product.colorOptions` / `Product.storageOptions` JSON columns
 * as either:
 *   - the new shape `Array<{ value: string; priceDelta: number }>`, or
 *   - the legacy shape `string[]` (auto-upgraded to `priceDelta: 0` on read).
 */
export type ProductVariantOption = {
  value: string;
  priceDelta: number;
};

/** Hard cap on `priceDelta`. Mirrors the price upper bound to keep math safe. */
const MAX_PRICE_DELTA = 1_000_000;

/**
 * Coerce an unknown JSON-shaped value into a flat list of variant options.
 * Tolerates both the new object shape and the legacy `string[]` shape so old
 * products keep rendering without a data backfill. Anything that can't be
 * coerced is dropped silently — callers should never see an exception here.
 *
 * - `priceDelta` is clamped to `[0, MAX_PRICE_DELTA]` and rounded to 2 dp.
 * - Empty/whitespace `value`s are dropped (an editor can leave blanks behind).
 * - List length is bounded by `MAX_SPEC_ENTRIES` to keep the DOM bounded.
 */
export const variantOptionsJsonToList = (
  raw: unknown,
): ProductVariantOption[] => {
  if (!Array.isArray(raw)) return [];

  const out: ProductVariantOption[] = [];

  for (const entry of raw) {
    if (typeof entry === "string") {
      const trimmed = entry.trim();
      if (trimmed.length === 0) continue;
      out.push({
        value: trimmed.slice(0, MAX_VALUE_LEN),
        priceDelta: 0,
      });
    } else if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      const obj = entry as Record<string, unknown>;
      const rawValue = obj.value;
      if (typeof rawValue !== "string") continue;
      const value = rawValue.trim();
      if (value.length === 0) continue;

      let priceDelta = 0;
      const rawDelta = obj.priceDelta;
      if (typeof rawDelta === "number" && Number.isFinite(rawDelta)) {
        priceDelta = rawDelta;
      } else if (typeof rawDelta === "string") {
        const parsed = Number.parseFloat(rawDelta);
        if (Number.isFinite(parsed)) priceDelta = parsed;
      }
      priceDelta = Math.max(0, Math.min(MAX_PRICE_DELTA, priceDelta));
      // Round to 2 decimals so display + math are stable across surfaces.
      priceDelta = Math.round(priceDelta * 100) / 100;

      out.push({ value: value.slice(0, MAX_VALUE_LEN), priceDelta });
    }

    if (out.length >= MAX_SPEC_ENTRIES) break;
  }

  return out;
};

/**
 * Same defensive treatment for `colorOptions`. Color values may be names
 * (`"Midnight Black"`) or hex codes (`"#0a0a0a"`); each row may carry an
 * optional `priceDelta` so admins can charge a premium for, say, a glossy
 * white finish on top of a black base price.
 */
export const colorOptionsJsonToList = (raw: unknown): ProductVariantOption[] =>
  variantOptionsJsonToList(raw);

/**
 * Same defensive treatment for `storageOptions`. Free-text values
 * (`"64 GB"`, `"128 GB"`, `"1 TB"`); each row may carry an optional
 * `priceDelta` so larger capacities can be priced higher than the base.
 */
export const storageOptionsJsonToList = (
  raw: unknown,
): ProductVariantOption[] => variantOptionsJsonToList(raw);
