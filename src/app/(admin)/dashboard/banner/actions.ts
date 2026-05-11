"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import {
  filterExistingProductIds,
  searchAdminProductsForLink,
} from "@/lib/hero/admin-data";
import {
  adminHeroSlideFormSchema,
  parseHeroLinkedProductIdsJsonInput,
  parseHeroSpecsJsonInput,
} from "@/lib/hero/admin-schemas";
import type { AdminHeroLinkedProduct } from "@/lib/hero/admin-types";
import { HERO_IMAGE_MAX_BYTES } from "@/lib/hero/image-constants";
import {
  deleteHeroImageIfOwned,
  saveHeroImage,
  type SaveHeroImageError,
} from "@/lib/hero/image-storage";
import type {
  DeleteHeroSlideResult,
  HeroSlideFormFieldKey,
  HeroSlideFormState,
} from "./form-state";

/* <SECURITY_REVIEW>
 * Vulnerability audit:
 * - Auth bypass: requireAdmin() runs server-side before any DB read/write;
 *   non-admin sessions are redirected.
 * - SQL injection: Prisma parameterises all queries; no raw SQL.
 * - IDOR: slideId validated as a short string; lookups use Prisma where:{id}.
 * - Mass assignment: only whitelisted fields from Zod-parsed payloads written.
 * - File path traversal: deleteHeroImageIfOwned() restricts deletes to our own
 *   blob host or paths under the hero upload dir; arbitrary URLs are ignored.
 * - Image upload: magic-byte validated; random UUID filename (no user-controlled
 *   paths); size capped (HERO_IMAGE_MAX_BYTES); only stored under our own dir
 *   or blob host.
 * - XSS: imageAlt is plain text rendered by `next/image`; specs render through
 *   React text nodes (auto-escaped). No `dangerouslySetInnerHTML`.
 *
 * Mitigations: Zod validation at the trust boundary; cleanup of just-uploaded
 * images on DB write failure (no orphaned blobs on the happy-path failure mode).
 *
 * Verification: a non-admin session POSTing any of these actions is redirected
 * to "/" without DB changes; deleting a missing slide returns
 * { ok: false, error: 'not_found' }.
 * </SECURITY_REVIEW>
 */

const heroSlideIdSchema = z
  .string()
  .min(1, "Slide id is required.")
  .max(40, "Invalid slide id.");

const LIST_HREF = "/dashboard/banner";

const fieldErrorsFromZod = (
  error: z.ZodError,
): Partial<Record<HeroSlideFormFieldKey, string>> => {
  const fieldErrors: Partial<Record<HeroSlideFormFieldKey, string>> = {};
  for (const issue of error.issues) {
    const top = issue.path[0];
    if (typeof top !== "string") continue;
    if (
      top === "name" ||
      top === "imageAlt" ||
      top === "sortOrder" ||
      top === "isActive"
    ) {
      if (!fieldErrors[top]) fieldErrors[top] = issue.message;
    }
  }
  return fieldErrors;
};

const parseFormDataInput = (formData: FormData) => ({
  name: String(formData.get("name") ?? ""),
  imageAlt: String(formData.get("imageAlt") ?? ""),
  sortOrder: String(formData.get("sortOrder") ?? "0"),
  isActive: formData.has("isActive")
    ? String(formData.get("isActive") ?? "")
    : undefined,
});

const extractFormImage = (formData: FormData): File | null => {
  const value = formData.get("image");
  if (!value || typeof value === "string") return null;
  if (value.size === 0) return null;
  return value;
};

const imageUploadErrorMessage = (error: SaveHeroImageError): string => {
  if (error === "too_large")
    return `Image is too large. Maximum size is ${HERO_IMAGE_MAX_BYTES / (1024 * 1024)} MB.`;
  if (error === "invalid_format")
    return "Image must be a JPEG, PNG, or WebP file.";
  if (error === "blob_required")
    return "Image upload requires file storage on this host. Ask the site admin to enable Vercel Blob (BLOB_READ_WRITE_TOKEN).";
  return "Could not save the uploaded image. Please try again.";
};

type ParseSpecsResult =
  | { ok: true; specs: string[] }
  | { ok: false; state: HeroSlideFormState };

const parseSpecsFromFormData = (formData: FormData): ParseSpecsResult => {
  try {
    return {
      ok: true,
      specs: parseHeroSpecsJsonInput(String(formData.get("specsJson") ?? "")),
    };
  } catch (error) {
    return {
      ok: false,
      state: {
        errorMessage: null,
        fieldErrors: {
          specs: error instanceof Error ? error.message : "Invalid spec lines.",
        },
      },
    };
  }
};

type ParseLinkedProductsResult =
  | { ok: true; productIds: string[] }
  | { ok: false; state: HeroSlideFormState };

/**
 * Parses the hidden `linkedProductIdsJson` field and removes any ids that no
 * longer exist on `Product`. Dropping stale ids silently keeps the form usable
 * if a product was deleted in another tab; the user can re-add fresh links.
 */
const parseLinkedProductsFromFormData = async (
  formData: FormData,
): Promise<ParseLinkedProductsResult> => {
  try {
    const parsed = parseHeroLinkedProductIdsJsonInput(
      String(formData.get("linkedProductIdsJson") ?? ""),
    );
    const productIds = await filterExistingProductIds(parsed);
    return { ok: true, productIds };
  } catch (error) {
    return {
      ok: false,
      state: {
        errorMessage: null,
        fieldErrors: {
          linkedProducts:
            error instanceof Error ? error.message : "Invalid linked products.",
        },
      },
    };
  }
};

const buildProductLinkCreateRows = (
  productIds: ReadonlyArray<string>,
): Array<{ product: { connect: { id: string } }; position: number }> =>
  productIds.map((productId, position) => ({
    product: { connect: { id: productId } },
    position,
  }));

const invalidateAfterMutation = (slideId?: string) => {
  revalidatePath(LIST_HREF);
  if (slideId) {
    revalidatePath(`${LIST_HREF}/${slideId}/edit`);
    revalidatePath(`/banner/${slideId}`);
  }
  revalidatePath("/");
};

export const deleteHeroSlideAction = async (
  slideId: string,
): Promise<DeleteHeroSlideResult> => {
  await requireAdmin();

  const parsed = heroSlideIdSchema.safeParse(slideId);
  if (!parsed.success) return { ok: false, error: "invalid_id" };

  let imagePath: string | null = null;
  try {
    const existing = await prisma.heroSlide.findUnique({
      where: { id: parsed.data },
      select: { imagePath: true },
    });
    if (!existing) return { ok: false, error: "not_found" };
    imagePath = existing.imagePath;

    await prisma.heroSlide.delete({ where: { id: parsed.data } });
  } catch (error) {
    const code = (error as { code?: string } | undefined)?.code;
    if (code === "P2025") return { ok: false, error: "not_found" };
    console.error("deleteHeroSlideAction failed", {
      slideId: parsed.data,
      error,
    });
    return { ok: false, error: "unknown" };
  }

  // Best-effort cleanup; file deletion errors should not block UX.
  await deleteHeroImageIfOwned(imagePath);

  invalidateAfterMutation();
  return { ok: true };
};

export const createHeroSlideAction = async (
  _prevState: HeroSlideFormState,
  formData: FormData,
): Promise<HeroSlideFormState> => {
  await requireAdmin();

  const parsed = adminHeroSlideFormSchema.safeParse(
    parseFormDataInput(formData),
  );
  if (!parsed.success) {
    return {
      errorMessage: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const specs = parseSpecsFromFormData(formData);
  if (!specs.ok) return specs.state;

  const linkedProducts = await parseLinkedProductsFromFormData(formData);
  if (!linkedProducts.ok) return linkedProducts.state;

  const imageFile = extractFormImage(formData);
  if (!imageFile) {
    return {
      errorMessage: null,
      fieldErrors: { image: "Pick an image for this slide." },
    };
  }

  const upload = await saveHeroImage(imageFile);
  if (!upload.ok) {
    return {
      errorMessage: null,
      fieldErrors: { image: imageUploadErrorMessage(upload.error) },
    };
  }

  try {
    await prisma.heroSlide.create({
      data: {
        name: parsed.data.name,
        imageAlt: parsed.data.imageAlt,
        imagePath: upload.webPath,
        specs: specs.specs,
        sortOrder: parsed.data.sortOrder,
        isActive: parsed.data.isActive,
        products: {
          create: buildProductLinkCreateRows(linkedProducts.productIds),
        },
      },
      select: { id: true },
    });
  } catch (error) {
    // Roll back the just-uploaded image when the DB write fails.
    await deleteHeroImageIfOwned(upload.webPath);
    console.error("createHeroSlideAction failed", { error });
    return {
      errorMessage: "Could not create slide. Please try again.",
      fieldErrors: {},
    };
  }

  invalidateAfterMutation();
  redirect(`${LIST_HREF}?status=created`);
};

export const updateHeroSlideAction = async (
  _prevState: HeroSlideFormState,
  formData: FormData,
): Promise<HeroSlideFormState> => {
  await requireAdmin();

  const idParsed = heroSlideIdSchema.safeParse(
    String(formData.get("slideId") ?? ""),
  );
  if (!idParsed.success) {
    return { errorMessage: "Invalid slide id.", fieldErrors: {} };
  }

  const parsed = adminHeroSlideFormSchema.safeParse(
    parseFormDataInput(formData),
  );
  if (!parsed.success) {
    return {
      errorMessage: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const specs = parseSpecsFromFormData(formData);
  if (!specs.ok) return specs.state;

  const linkedProducts = await parseLinkedProductsFromFormData(formData);
  if (!linkedProducts.ok) return linkedProducts.state;

  const existing = await prisma.heroSlide.findUnique({
    where: { id: idParsed.data },
    select: { imagePath: true },
  });
  if (!existing) {
    return { errorMessage: "This slide no longer exists.", fieldErrors: {} };
  }

  // `existing.imagePath` is always non-null in practice (image is required on
  // create), so the only way to change it is to upload a replacement.
  let nextImagePath = existing.imagePath;
  let uploadedThisRequest: string | null = null;
  const imageFile = extractFormImage(formData);

  if (imageFile) {
    const upload = await saveHeroImage(imageFile);
    if (!upload.ok) {
      return {
        errorMessage: null,
        fieldErrors: { image: imageUploadErrorMessage(upload.error) },
      };
    }
    nextImagePath = upload.webPath;
    uploadedThisRequest = upload.webPath;
  }

  try {
    await prisma.heroSlide.update({
      where: { id: idParsed.data },
      data: {
        name: parsed.data.name,
        imageAlt: parsed.data.imageAlt,
        imagePath: nextImagePath,
        specs: specs.specs,
        sortOrder: parsed.data.sortOrder,
        isActive: parsed.data.isActive,
        products: {
          // Replace the link set atomically: clearing all rows and recreating
          // them in array order is simpler than a diff and the table is tiny.
          deleteMany: {},
          create: buildProductLinkCreateRows(linkedProducts.productIds),
        },
      },
    });
  } catch (error) {
    if (uploadedThisRequest) {
      await deleteHeroImageIfOwned(uploadedThisRequest);
    }
    const code = (error as { code?: string } | undefined)?.code;
    if (code === "P2025") {
      return { errorMessage: "This slide no longer exists.", fieldErrors: {} };
    }
    console.error("updateHeroSlideAction failed", {
      slideId: idParsed.data,
      error,
    });
    return {
      errorMessage: "Could not save slide. Please try again.",
      fieldErrors: {},
    };
  }

  // Drop the previous image only after the DB write succeeded and only if we
  // replaced it with a new upload.
  if (existing.imagePath && existing.imagePath !== nextImagePath) {
    await deleteHeroImageIfOwned(existing.imagePath);
  }

  invalidateAfterMutation(idParsed.data);
  redirect(`${LIST_HREF}?status=updated`);
};

const PRODUCT_SEARCH_QUERY_MAX = 80;

/**
 * Admin-only typeahead used by the linked-products picker. Defensively caps
 * the query length, requires the admin guard, and dedupes the excluded ids
 * so a tampered client payload cannot exhaust the row cap.
 */
export const searchProductsForBannerAction = async (input: {
  query: string;
  excludeIds?: ReadonlyArray<string>;
}): Promise<AdminHeroLinkedProduct[]> => {
  await requireAdmin();
  const rawQuery = typeof input?.query === "string" ? input.query : "";
  const query = rawQuery.trim().slice(0, PRODUCT_SEARCH_QUERY_MAX);
  if (query.length < 2) return [];

  const excludeIds = Array.isArray(input?.excludeIds)
    ? input.excludeIds.filter(
        (value): value is string =>
          typeof value === "string" && value.length > 0 && value.length <= 40,
      )
    : [];

  return searchAdminProductsForLink(query, { excludeIds });
};
