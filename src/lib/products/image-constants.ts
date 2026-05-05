/**
 * Client-safe constants for product image uploads.
 *
 * Kept in its own module (no Node/Blob imports) so client components like the
 * product form can pull the size cap without dragging `node:fs/promises`,
 * `node:crypto`, or `@vercel/blob` into the browser bundle.
 */

export const PRODUCT_IMAGE_MAX_BYTES = 2 * 1024 * 1024; // 2 MiB

export const PRODUCT_IMAGE_ACCEPT_MIME = "image/jpeg,image/png,image/webp";
