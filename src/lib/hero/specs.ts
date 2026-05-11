/**
 * Normalises a hero slide `specs` JSON column into a clean `string[]`.
 * Defensive: tolerates non-array values and non-string entries by dropping
 * them, so a malformed row never crashes the storefront.
 */
export const specsJsonToList = (raw: unknown): string[] => {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== "string") continue;
    const trimmed = entry.trim();
    if (trimmed.length === 0) continue;
    out.push(trimmed);
  }
  return out;
};
