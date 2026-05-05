/**
 * Product image storage:
 * - Persists uploads to Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set.
 * - Otherwise writes to `public/uploads/products/` on local disk (dev / self-host).
 * - On Vercel runtime without a blob token, refuses to write (no persistent disk).
 *
 * Stores the public URL/path string on `Product.imagePath`. The same string is
 * later passed to `deleteProductImageIfOwned` to clean up safely on replace/delete.
 *
 * Server-only: pulls in `node:fs/promises`, `node:crypto`, and `@vercel/blob`.
 * Client components must import constants from `./image-constants` instead.
 */

import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";
import {
  contentTypeForImageKind,
  extensionForImageKind,
  validateImageBuffer,
} from "@/lib/image/validate-buffer";
import { PRODUCT_IMAGE_MAX_BYTES } from "@/lib/products/image-constants";

const PRODUCT_UPLOAD_DIR = path.join("public", "uploads", "products");
const PRODUCT_UPLOAD_WEB_PREFIX = "/uploads/products";
const PRODUCT_BLOB_PREFIX = "products";

const blobReadWriteToken = (): string | undefined =>
  process.env.BLOB_READ_WRITE_TOKEN?.trim() || undefined;

const isVercelRuntime = (): boolean =>
  process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);

const isVercelBlobPublicStorageUrl = (url: string): boolean => {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    return (
      u.hostname.endsWith(".public.blob.vercel-storage.com") ||
      u.hostname === "public.blob.vercel-storage.com"
    );
  } catch {
    return false;
  }
};

const resolveSafeProductImageDiskPath = (webPath: string): string | null => {
  if (!webPath.startsWith(`${PRODUCT_UPLOAD_WEB_PREFIX}/`)) return null;
  const relativeFromPublic = webPath.replace(/^\//, "");
  const abs = path.resolve(process.cwd(), "public", relativeFromPublic);
  const root = path.resolve(process.cwd(), PRODUCT_UPLOAD_DIR);
  if (abs !== root && !abs.startsWith(`${root}${path.sep}`)) return null;
  return abs;
};

export type SaveProductImageError =
  | "invalid_format"
  | "too_large"
  | "blob_required"
  | "upload_failed";

export type SaveProductImageResult =
  | { ok: true; webPath: string }
  | { ok: false; error: SaveProductImageError };

/**
 * Saves an uploaded product image and returns its public URL (`webPath`).
 * Magic-byte validates the buffer; never trusts the supplied filename or MIME.
 */
export const saveProductImage = async (
  file: File,
): Promise<SaveProductImageResult> => {
  if (file.size === 0) {
    return { ok: false, error: "invalid_format" };
  }
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
    return { ok: false, error: "too_large" };
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const validated = validateImageBuffer(buf);
  if (!validated.ok) {
    return { ok: false, error: "invalid_format" };
  }

  const ext = extensionForImageKind(validated.kind);
  const fileName = `${randomUUID()}.${ext}`;
  const blobToken = blobReadWriteToken();

  if (blobToken) {
    try {
      const blob = await put(`${PRODUCT_BLOB_PREFIX}/${fileName}`, buf, {
        access: "public",
        token: blobToken,
        contentType: contentTypeForImageKind(validated.kind),
      });
      return { ok: true, webPath: blob.url };
    } catch (error) {
      console.error("product-image blob upload failed", { error });
      return { ok: false, error: "upload_failed" };
    }
  }

  if (isVercelRuntime()) {
    return { ok: false, error: "blob_required" };
  }

  const dirAbs = path.join(process.cwd(), PRODUCT_UPLOAD_DIR);
  await mkdir(dirAbs, { recursive: true });
  const diskPath = path.join(dirAbs, fileName);

  try {
    await writeFile(diskPath, buf);
  } catch (error) {
    console.error("product-image local write failed", { diskPath, error });
    return { ok: false, error: "upload_failed" };
  }

  return { ok: true, webPath: `${PRODUCT_UPLOAD_WEB_PREFIX}/${fileName}` };
};

/**
 * Removes a previously stored product image (best-effort).
 * Only deletes paths/URLs we know we own (our blob host or our upload dir).
 */
export const deleteProductImageIfOwned = async (
  webPath: string | null | undefined,
): Promise<void> => {
  if (!webPath) return;

  if (isVercelBlobPublicStorageUrl(webPath)) {
    const token = blobReadWriteToken();
    if (!token) return;
    try {
      await del(webPath, { token });
    } catch {
      /* ignore */
    }
    return;
  }

  const abs = resolveSafeProductImageDiskPath(webPath);
  if (!abs) return;
  try {
    await unlink(abs);
  } catch {
    /* ignore (file may already be gone) */
  }
};
