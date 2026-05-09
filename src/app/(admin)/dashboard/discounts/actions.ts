"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guards";
import { adminDiscountFormSchema } from "@/lib/discounts/admin-schemas";
import { prisma } from "@/lib/prisma";
import type {
  DeleteDiscountResult,
  DiscountFormFieldKey,
  DiscountFormState,
  SetDiscountActiveResult,
} from "./form-state";

/* <SECURITY_REVIEW>
 * Vulnerability audit:
 * - Auth bypass: requireAdmin() runs server-side before any DB read/write; non-admin
 *   sessions are redirected.
 * - SQL injection: Prisma parameterises all queries; no raw SQL.
 * - IDOR: discountId validated as a short string; lookups use Prisma where:{id}.
 * - Mass assignment: only whitelisted fields from Zod-parsed payloads are written.
 * - Duplicate codes: unique index + P2002 mapped to a field-level error.
 *
 * Mitigations: Zod validation at the trust boundary; fail closed on invalid ids;
 * revalidatePath('/dashboard/discounts') after mutations.
 *
 * Verification: an authenticated USER (non-admin) POSTing these actions is
 * redirected to "/" without DB changes. Duplicate code on create returns a
 * field error on `code`.
 * </SECURITY_REVIEW>
 */

const discountIdSchema = z
  .string()
  .min(1, "Discount id is required.")
  .max(40, "Invalid discount id.");

const buildSafeListRedirect = (
  rawReturnTo: FormDataEntryValue | null,
  bannerStatus: "updated",
): string => {
  if (typeof rawReturnTo !== "string") {
    return `/dashboard/discounts?status=${bannerStatus}`;
  }
  const trimmed = rawReturnTo.trim();
  if (!trimmed.startsWith("/dashboard/discounts")) {
    return `/dashboard/discounts?status=${bannerStatus}`;
  }
  const [pathname, rawQuery = ""] = trimmed.split("?", 2);
  if (pathname !== "/dashboard/discounts") {
    return `/dashboard/discounts?status=${bannerStatus}`;
  }
  const params = new URLSearchParams(rawQuery);
  params.set("status", bannerStatus);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
};

const fieldErrorsFromZod = (
  error: z.ZodError,
): Partial<Record<DiscountFormFieldKey, string>> => {
  const fieldErrors: Partial<Record<DiscountFormFieldKey, string>> = {};
  for (const issue of error.issues) {
    const top = issue.path[0];
    if (typeof top !== "string") continue;
    if (
      top === "name" ||
      top === "code" ||
      top === "discountType" ||
      top === "discountValue" ||
      top === "minOrderAmount" ||
      top === "maxDiscountAmount" ||
      top === "startDate" ||
      top === "endDate" ||
      top === "isActive"
    ) {
      if (!fieldErrors[top]) fieldErrors[top] = issue.message;
    }
  }
  return fieldErrors;
};

const parseFormDataInput = (formData: FormData) => ({
  name: String(formData.get("name") ?? ""),
  code: String(formData.get("code") ?? ""),
  discountType: String(formData.get("discountType") ?? ""),
  discountValue: String(formData.get("discountValue") ?? ""),
  minOrderAmount: String(formData.get("minOrderAmount") ?? ""),
  maxDiscountAmount: String(formData.get("maxDiscountAmount") ?? ""),
  startDate: String(formData.get("startDate") ?? ""),
  endDate: String(formData.get("endDate") ?? ""),
  /** Match checkbox FormData + `adminDiscountFormSchema` (string | undefined), not a boolean. */
  isActive: formData.has("isActive")
    ? String(formData.get("isActive") ?? "")
    : undefined,
});

export const deleteDiscountAction = async (
  discountId: string,
): Promise<DeleteDiscountResult> => {
  await requireAdmin();

  const parsed = discountIdSchema.safeParse(discountId);
  if (!parsed.success) return { ok: false, error: "invalid_id" };

  try {
    await prisma.discount.delete({ where: { id: parsed.data } });
  } catch (error) {
    const code = (error as { code?: string } | undefined)?.code;
    if (code === "P2025") return { ok: false, error: "not_found" };
    console.error("deleteDiscountAction failed", {
      discountId: parsed.data,
      error,
    });
    return { ok: false, error: "unknown" };
  }

  revalidatePath("/dashboard/discounts");
  return { ok: true };
};

export const setDiscountActiveAction = async (
  discountId: unknown,
  isActive: unknown,
): Promise<SetDiscountActiveResult> => {
  await requireAdmin();

  const idParsed = discountIdSchema.safeParse(discountId);
  if (!idParsed.success) return { ok: false, error: "invalid_id" };

  const activeParsed = z.boolean().safeParse(isActive);
  if (!activeParsed.success) return { ok: false, error: "invalid_id" };

  try {
    await prisma.discount.update({
      where: { id: idParsed.data },
      data: { isActive: activeParsed.data },
    });
  } catch (error) {
    const code = (error as { code?: string } | undefined)?.code;
    if (code === "P2025") return { ok: false, error: "not_found" };
    console.error("setDiscountActiveAction failed", {
      discountId: idParsed.data,
      error,
    });
    return { ok: false, error: "unknown" };
  }

  revalidatePath("/dashboard/discounts");
  return { ok: true };
};

const prismaDecimal = (n: number): string => n.toFixed(2);

const isUniqueConstraintOnCode = (error: unknown): boolean => {
  const err = error as { code?: string; meta?: { target?: unknown } };
  if (err.code !== "P2002") return false;
  const target = err.meta?.target;
  if (Array.isArray(target)) return target.includes("code");
  if (typeof target === "string") return target.includes("code");
  return true;
};

export const createDiscountAction = async (
  _prevState: DiscountFormState,
  formData: FormData,
): Promise<DiscountFormState> => {
  await requireAdmin();

  const input = parseFormDataInput(formData);
  const parsed = adminDiscountFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      errorMessage: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const data = parsed.data;

  try {
    await prisma.discount.create({
      data: {
        name: data.name,
        code: data.code,
        discountType: data.discountType,
        discountValue: prismaDecimal(data.discountValue),
        minOrderAmount:
          data.minOrderAmount === null
            ? null
            : prismaDecimal(data.minOrderAmount),
        maxDiscountAmount:
          data.maxDiscountAmount === null
            ? null
            : prismaDecimal(data.maxDiscountAmount),
        startAt: data.startAt,
        endAt: data.endAt,
        isActive: data.isActive,
      },
      select: { id: true },
    });
  } catch (error) {
    if (isUniqueConstraintOnCode(error)) {
      return {
        errorMessage: null,
        fieldErrors: {
          code: "This discount code is already in use. Choose another code.",
        },
      };
    }
    console.error("createDiscountAction failed", { error });
    return {
      errorMessage: "Could not create discount. Please try again.",
      fieldErrors: {},
    };
  }

  revalidatePath("/dashboard/discounts");
  redirect("/dashboard/discounts?status=created");
};

export const updateDiscountAction = async (
  _prevState: DiscountFormState,
  formData: FormData,
): Promise<DiscountFormState> => {
  await requireAdmin();
  const nextListHref = buildSafeListRedirect(
    formData.get("returnTo"),
    "updated",
  );

  const discountIdRaw = String(formData.get("discountId") ?? "");
  const idParsed = discountIdSchema.safeParse(discountIdRaw);
  if (!idParsed.success) {
    return {
      errorMessage: "Invalid discount id.",
      fieldErrors: {},
    };
  }

  const input = parseFormDataInput(formData);
  const parsed = adminDiscountFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      errorMessage: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const data = parsed.data;

  try {
    await prisma.discount.update({
      where: { id: idParsed.data },
      data: {
        name: data.name,
        code: data.code,
        discountType: data.discountType,
        discountValue: prismaDecimal(data.discountValue),
        minOrderAmount:
          data.minOrderAmount === null
            ? null
            : prismaDecimal(data.minOrderAmount),
        maxDiscountAmount:
          data.maxDiscountAmount === null
            ? null
            : prismaDecimal(data.maxDiscountAmount),
        startAt: data.startAt,
        endAt: data.endAt,
        isActive: data.isActive,
      },
      select: { id: true },
    });
  } catch (error) {
    const code = (error as { code?: string } | undefined)?.code;
    if (code === "P2025") {
      return {
        errorMessage: "This discount no longer exists.",
        fieldErrors: {},
      };
    }
    if (isUniqueConstraintOnCode(error)) {
      return {
        errorMessage: null,
        fieldErrors: {
          code: "This discount code is already in use. Choose another code.",
        },
      };
    }
    console.error("updateDiscountAction failed", { error });
    return {
      errorMessage: "Could not save discount. Please try again.",
      fieldErrors: {},
    };
  }

  revalidatePath("/dashboard/discounts");
  revalidatePath(`/dashboard/discounts/${idParsed.data}/edit`);
  redirect(nextListHref);
};
