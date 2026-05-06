/**
 * Restrict storefront image `src` to safe values:
 * - same-origin path-relative (`/uploads/...`),
 * - absolute `http(s)://` URLs (e.g. Vercel Blob).
 *
 * Anything else (e.g. `javascript:`, `data:`, malformed) is treated as missing
 * so the card falls back to the placeholder. Defence-in-depth: catalog data
 * is admin-controlled, but we render it in a public Server Component, so we
 * don't trust the column blindly.
 */
export const safeProductImageSrc = (
  imagePath: string | null | undefined,
): string | null => {
  if (!imagePath) return null;
  const trimmed = imagePath.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return null;
};
