/**
 * Client-safe constants for hero slide image uploads.
 *
 * Kept in its own module (no Node/Blob imports) so client components can pull
 * the size cap and accept-list without dragging `node:fs/promises`,
 * `node:crypto`, or `@vercel/blob` into the browser bundle.
 */

export const HERO_IMAGE_MAX_BYTES = 2 * 1024 * 1024; // 2 MiB

export const HERO_IMAGE_ACCEPT_MIME = "image/jpeg,image/png,image/webp";
