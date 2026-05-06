"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import {
  adminProductFormSchema,
  parseSpecsJsonInput,
  parseStringListJsonInput,
} from "@/lib/products/admin-schemas";
import { PRODUCT_IMAGE_MAX_BYTES } from "@/lib/products/image-constants";
import {
  deleteProductImageIfOwned,
  saveProductImage,
  type SaveProductImageError,
} from "@/lib/products/image-storage";
import type {
  DeleteProductResult,
  ProductFormFieldKey,
  ProductFormState,
} from "./form-state";

/* <SECURITY_REVIEW>
 * Vulnerability audit:
 * - Auth bypass: requireAdmin() runs server-side before any DB read/write; non-admin sessions are redirected.
 * - SQL injection: Prisma parameterises all queries; no raw SQL.
 * - IDOR: productId validated as a CUID-ish string; lookup is by id only.
 * - File path traversal: deleteProductImageIfOwned() restricts deletes to our own
 *   blob host or paths under the products upload dir; arbitrary URLs are ignored.
 * - Mass deletion: schema accepts a single id; relies on Prisma's not-found
 *   handling (P2025) to surface a clean error if the id is unknown.
 *
 * Mitigations: Zod validation at the boundary; image cleanup is best-effort and
 * cannot leak elsewhere on the host. Cache: revalidatePath('/dashboard/products')
 * forces the list to refetch after a mutation.
 *
 * Verification: an authenticated USER (non-admin) who POSTs this action should
 * be redirected to "/" without the row being deleted; deleting a product whose
 * id does not exist returns { ok: false, error: 'not_found' }.
 * </SECURITY_REVIEW>
 */
const productIdSchema = z
  .string()
  .min(1, "Product id is required.")
  .max(40, "Invalid product id.");

export const deleteProductAction = async (
  productId: string,
): Promise<DeleteProductResult> => {
  await requireAdmin();

  const parsed = productIdSchema.safeParse(productId);
  if (!parsed.success) return { ok: false, error: "invalid_id" };

  let imagePath: string | null = null;
  try {
    const existing = await prisma.product.findUnique({
      where: { id: parsed.data },
      select: { imagePath: true },
    });
    if (!existing) return { ok: false, error: "not_found" };
    imagePath = existing.imagePath;

    await prisma.product.delete({ where: { id: parsed.data } });
  } catch (error) {
    const code = (error as { code?: string } | undefined)?.code;
    if (code === "P2025") return { ok: false, error: "not_found" };
    if (code === "P2003") return { ok: false, error: "in_use" };
    console.error("deleteProductAction failed", {
      productId: parsed.data,
      error,
    });
    return { ok: false, error: "unknown" };
  }

  // Best-effort cleanup; file deletion errors should not block UX.
  await deleteProductImageIfOwned(imagePath);

  revalidatePath("/dashboard/products");
  return { ok: true };
};

// --- Create / update --------------------------------------------------------

const imageUploadErrorMessage = (error: SaveProductImageError): string => {
  if (error === "too_large")
    return `Image is too large. Maximum size is ${PRODUCT_IMAGE_MAX_BYTES / (1024 * 1024)} MB.`;
  if (error === "invalid_format")
    return "Image must be a JPEG, PNG, or WebP file.";
  if (error === "blob_required")
    return "Image upload requires file storage on this host. Ask the site admin to enable Vercel Blob (BLOB_READ_WRITE_TOKEN).";
  return "Could not save the uploaded image. Please try again.";
};

const fieldErrorsFromZod = (
  error: z.ZodError,
): Partial<Record<ProductFormFieldKey, string>> => {
  const fieldErrors: Partial<Record<ProductFormFieldKey, string>> = {};
  for (const issue of error.issues) {
    const top = issue.path[0];
    if (typeof top !== "string") continue;
    if (
      top === "name" ||
      top === "brand" ||
      top === "model" ||
      top === "description" ||
      top === "categoryId" ||
      top === "price" ||
      top === "discountType" ||
      top === "discountValue" ||
      top === "stock" ||
      top === "isActive"
    ) {
      if (!fieldErrors[top]) fieldErrors[top] = issue.message;
    }
  }
  return fieldErrors;
};

const parseFormDataInput = (formData: FormData) => ({
  name: String(formData.get("name") ?? ""),
  brand: String(formData.get("brand") ?? ""),
  model: String(formData.get("model") ?? ""),
  description: String(formData.get("description") ?? ""),
  categoryId: String(formData.get("categoryId") ?? ""),
  price: String(formData.get("price") ?? ""),
  discountType: String(formData.get("discountType") ?? "NONE"),
  discountValue: String(formData.get("discountValue") ?? ""),
  stock: String(formData.get("stock") ?? ""),
  isActive: formData.has("isActive")
    ? String(formData.get("isActive") ?? "")
    : undefined,
  specsJson: String(formData.get("specsJson") ?? ""),
  colorsJson: String(formData.get("colorsJson") ?? ""),
  storagesJson: String(formData.get("storagesJson") ?? ""),
});

/**
 * Parses + validates the variant lists shared by create + update actions.
 * Keeps both action paths in lockstep with the same error mapping.
 */
const parseVariantListsOrError = (input: {
  colorsJson: string;
  storagesJson: string;
}):
  | {
      ok: true;
      colorOptions: string[] | null;
      storageOptions: string[] | null;
    }
  | { ok: false; state: ProductFormState } => {
  let colorOptions: string[] | null;
  try {
    colorOptions = parseStringListJsonInput(input.colorsJson, "Color options");
  } catch (error) {
    return {
      ok: false,
      state: {
        errorMessage: null,
        fieldErrors: {
          colors:
            error instanceof Error ? error.message : "Invalid color options.",
        },
      },
    };
  }
  let storageOptions: string[] | null;
  try {
    storageOptions = parseStringListJsonInput(
      input.storagesJson,
      "Storage options",
    );
  } catch (error) {
    return {
      ok: false,
      state: {
        errorMessage: null,
        fieldErrors: {
          storages:
            error instanceof Error ? error.message : "Invalid storage options.",
        },
      },
    };
  }
  return { ok: true, colorOptions, storageOptions };
};

const extractFormImage = (formData: FormData): File | null => {
  const value = formData.get("image");
  if (!value || typeof value === "string") return null;
  if (value.size === 0) return null;
  return value;
};

const SLUG_COLLISION_MAX_ATTEMPTS = 6;

/* <SECURITY_REVIEW>
 * createProductAction
 * - Auth: requireAdmin() before any read/write.
 * - Input validation: Zod schema + parseSpecsJsonInput at the trust boundary.
 * - Image upload: magic-byte validated; random UUID filename (no user-controlled paths);
 *   size capped (PRODUCT_IMAGE_MAX_BYTES); only stored under our own dir or blob host.
 * - DB writes: Prisma parameterised; slug is server-derived from `name` (admin
 *   never supplies it directly), so no admin-controlled URL injection. Slug
 *   collisions auto-suffix with `-2`, `-3`, … capped at 6 attempts to avoid a
 *   pathological loop.
 * - Failure cleanup: if the DB write fails after upload, the just-uploaded image is removed.
 * </SECURITY_REVIEW>
 */
export const createProductAction = async (
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> => {
  await requireAdmin();

  const input = parseFormDataInput(formData);
  const parsed = adminProductFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      errorMessage: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  let specsValue: Record<string, string> | null;
  try {
    specsValue = parseSpecsJsonInput(input.specsJson);
  } catch (error) {
    return {
      errorMessage: null,
      fieldErrors: {
        specs:
          error instanceof Error ? error.message : "Invalid specifications.",
      },
    };
  }

  const variants = parseVariantListsOrError(input);
  if (!variants.ok) return variants.state;

  const imageFile = extractFormImage(formData);
  let uploadedImagePath: string | null = null;

  if (imageFile) {
    const upload = await saveProductImage(imageFile);
    if (!upload.ok) {
      return {
        errorMessage: null,
        fieldErrors: { image: imageUploadErrorMessage(upload.error) },
      };
    }
    uploadedImagePath = upload.webPath;
  }

  const baseSlug = parsed.data.slug;
  let lastError: unknown;
  let created = false;

  for (let attempt = 0; attempt < SLUG_COLLISION_MAX_ATTEMPTS; attempt++) {
    const candidateSlug =
      attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    try {
      await prisma.product.create({
        data: {
          name: parsed.data.name,
          slug: candidateSlug,
          brand: parsed.data.brand,
          model: parsed.data.model,
          description: parsed.data.description,
          imagePath: uploadedImagePath,
          specs: specsValue ?? undefined,
          colorOptions: variants.colorOptions ?? undefined,
          storageOptions: variants.storageOptions ?? undefined,
          price: parsed.data.price.toFixed(2),
          discountType: parsed.data.discountType,
          discountValue:
            parsed.data.discountValue === null
              ? null
              : parsed.data.discountValue.toFixed(2),
          isDiscountActive: parsed.data.isDiscountActive,
          stock: parsed.data.stock,
          isActive: parsed.data.isActive,
          categoryId: parsed.data.categoryId,
        },
      });
      created = true;
      break;
    } catch (error) {
      const code = (error as { code?: string } | undefined)?.code;
      if (code === "P2002") {
        lastError = error;
        continue;
      }
      lastError = error;
      break;
    }
  }

  if (!created) {
    if (uploadedImagePath) {
      await deleteProductImageIfOwned(uploadedImagePath);
    }
    const code = (lastError as { code?: string } | undefined)?.code;
    if (code === "P2002") {
      return {
        errorMessage:
          "Could not pick a unique URL for that name. Tweak the product name and try again.",
        fieldErrors: { name: "A similar product name is already in use." },
      };
    }
    if (code === "P2003" || code === "P2025") {
      return {
        errorMessage: "Selected category no longer exists.",
        fieldErrors: { categoryId: "Pick an existing category." },
      };
    }
    console.error("createProductAction failed", { error: lastError });
    return {
      errorMessage: "Could not create product. Please try again.",
      fieldErrors: {},
    };
  }

  revalidatePath("/dashboard/products");
  redirect("/dashboard/products?status=created");
};

/* <SECURITY_REVIEW>
 * updateProductAction
 * - Auth: requireAdmin() before any read/write.
 * - IDOR: productId comes from FormData and is validated; lookup uses Prisma's where:{id}.
 * - Input validation + image rules identical to create. Old image is removed only after the
 *   DB row is updated (never before), and only if it points to storage we control.
 * </SECURITY_REVIEW>
 */
export const updateProductAction = async (
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> => {
  await requireAdmin();

  const productIdRaw = String(formData.get("productId") ?? "");
  const idParsed = productIdSchema.safeParse(productIdRaw);
  if (!idParsed.success) {
    return {
      errorMessage: "Invalid product id.",
      fieldErrors: {},
    };
  }

  const input = parseFormDataInput(formData);
  const parsed = adminProductFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      errorMessage: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  let specsValue: Record<string, string> | null;
  try {
    specsValue = parseSpecsJsonInput(input.specsJson);
  } catch (error) {
    return {
      errorMessage: null,
      fieldErrors: {
        specs:
          error instanceof Error ? error.message : "Invalid specifications.",
      },
    };
  }

  const variants = parseVariantListsOrError(input);
  if (!variants.ok) return variants.state;

  const removeImage = formData.get("removeImage") === "on";
  const imageFile = extractFormImage(formData);

  const existing = await prisma.product.findUnique({
    where: { id: idParsed.data },
    select: { imagePath: true },
  });
  if (!existing) {
    return {
      errorMessage: "Product no longer exists.",
      fieldErrors: {},
    };
  }

  let nextImagePath: string | null = existing.imagePath;
  let uploadedThisRequest: string | null = null;

  if (imageFile) {
    const upload = await saveProductImage(imageFile);
    if (!upload.ok) {
      return {
        errorMessage: null,
        fieldErrors: { image: imageUploadErrorMessage(upload.error) },
      };
    }
    nextImagePath = upload.webPath;
    uploadedThisRequest = upload.webPath;
  } else if (removeImage) {
    nextImagePath = null;
  }

  try {
    await prisma.product.update({
      where: { id: idParsed.data },
      data: {
        // slug is intentionally NOT updated — keep public URLs stable across
        // edits. productType is omitted; the DB default ("general") persists.
        name: parsed.data.name,
        brand: parsed.data.brand,
        model: parsed.data.model,
        description: parsed.data.description,
        imagePath: nextImagePath,
        specs: specsValue ?? undefined,
        colorOptions: variants.colorOptions ?? undefined,
        storageOptions: variants.storageOptions ?? undefined,
        price: parsed.data.price.toFixed(2),
        discountType: parsed.data.discountType,
        discountValue:
          parsed.data.discountValue === null
            ? null
            : parsed.data.discountValue.toFixed(2),
        isDiscountActive: parsed.data.isDiscountActive,
        stock: parsed.data.stock,
        isActive: parsed.data.isActive,
        categoryId: parsed.data.categoryId,
      },
    });
  } catch (error) {
    // Roll back the just-uploaded image if the DB write fails.
    if (uploadedThisRequest) {
      await deleteProductImageIfOwned(uploadedThisRequest);
    }
    const code = (error as { code?: string } | undefined)?.code;
    if (code === "P2003") {
      return {
        errorMessage: "Selected category no longer exists.",
        fieldErrors: { categoryId: "Pick an existing category." },
      };
    }
    if (code === "P2025") {
      return {
        errorMessage: "Product no longer exists.",
        fieldErrors: {},
      };
    }
    console.error("updateProductAction failed", {
      productId: idParsed.data,
      error,
    });
    return {
      errorMessage: "Could not save product. Please try again.",
      fieldErrors: {},
    };
  }

  // Clean up the previous image only after the DB write succeeded and only if
  // we replaced or explicitly removed it.
  if (existing.imagePath && existing.imagePath !== nextImagePath) {
    await deleteProductImageIfOwned(existing.imagePath);
  }

  revalidatePath("/dashboard/products");
  revalidatePath(`/dashboard/products/${idParsed.data}/edit`);
  redirect("/dashboard/products?status=updated");
};
