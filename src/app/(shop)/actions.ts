"use server";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SITE_HEADER, SITE_ROUTES } from "@/lib/config/site-config";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  CHECKOUT_PAYMENT_METHODS,
  checkoutToDbPaymentMethod,
} from "@/lib/orders/payment-method";
import { finalProductPrice } from "@/lib/products/discount";
import { resolveCartVoucher } from "@/lib/discounts/resolve-cart-voucher";
import {
  colorOptionsJsonToList,
  storageOptionsJsonToList,
} from "@/lib/products/specs";
import { signupPasswordSchema } from "@/lib/validation/signup-password-schema";
import {
  PROFILE_IMAGE_MAX_BYTES,
  type ProfileImageKind,
  extensionForProfileImageKind,
  validateProfileImageBuffer,
} from "@/lib/validate-profile-image";

const blobReadWriteToken = (): string | undefined =>
  process.env.BLOB_READ_WRITE_TOKEN?.trim() || undefined;
const isVercelRuntime = (): boolean =>
  process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);

const contentTypeForProfileImageKind = (kind: ProfileImageKind): string => {
  if (kind === "jpeg") return "image/jpeg";
  if (kind === "png") return "image/png";
  return "image/webp";
};

/** Only delete blob URLs on our expected host (never `del` user-controlled arbitrary URLs). */
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

const PROFILE_UPLOAD_DIR = path.join("public", "uploads", "profile-images");
const PROFILE_UPLOAD_WEB_PREFIX = "/uploads/profile-images";

const resolveSafeProfileImageDiskPath = (webPath: string): string | null => {
  if (!webPath.startsWith(`${PROFILE_UPLOAD_WEB_PREFIX}/`)) return null;
  const relativeFromPublic = webPath.replace(/^\//, "");
  const abs = path.resolve(process.cwd(), "public", relativeFromPublic);
  const root = path.resolve(process.cwd(), PROFILE_UPLOAD_DIR);
  if (abs !== root && !abs.startsWith(`${root}${path.sep}`)) return null;
  return abs;
};

/**
 * Names NextAuth may set (non-chunked). Chunked JWT sessions add suffixes like
 * `__Secure-next-auth.session-token.0` — those are picked up via `getAll()`.
 * Mirrors `next-auth/core/lib/cookie.js` `defaultCookies` naming.
 */
const knownNextAuthCookieNames = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
  "next-auth.pkce.code_verifier",
  "__Secure-next-auth.pkce.code_verifier",
  "next-auth.state",
  "__Secure-next-auth.state",
  "next-auth.nonce",
  "__Secure-next-auth.nonce",
] as const;

const isNextAuthCookieName = (name: string): boolean =>
  name.startsWith("next-auth.") ||
  name.startsWith("__Secure-next-auth.") ||
  name.startsWith("__Host-next-auth.");

/**
 * `__Secure-*` and `__Host-*` cookies only clear if Set-Cookie repeats `Secure`
 * (and `Path=/`, etc.) — bare `cookies().delete(name)` is ignored on HTTPS.
 */
const expireNextAuthCookie = (
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  name: string,
): void => {
  const needsSecure =
    name.startsWith("__Secure-") || name.startsWith("__Host-");
  cookieStore.set({
    name,
    value: "",
    path: "/",
    expires: new Date(0),
    httpOnly: true,
    sameSite: "lax",
    secure: needsSecure,
  });
};

const clearSessionCookies = async () => {
  const cookieStore = await cookies();
  const names = new Set<string>();

  for (const { name } of cookieStore.getAll()) {
    if (isNextAuthCookieName(name)) {
      names.add(name);
    }
  }
  for (const name of knownNextAuthCookieNames) {
    names.add(name);
  }

  for (const name of names) {
    expireNextAuthCookie(cookieStore, name);
  }
};

/** Clears auth cookies without redirect — use before showing logout success UI. */
export const clearSessionCookiesAction = async (): Promise<
  { ok: true } | { ok: false }
> => {
  try {
    await clearSessionCookies();
    return { ok: true };
  } catch {
    return { ok: false };
  }
};

export const logoutAction = async () => {
  await clearSessionCookies();
  redirect(SITE_ROUTES.home);
};

const profileUpdateSchema = z.object({
  firstName: z
    .string()
    .max(80)
    .transform((s) => (s.trim().length === 0 ? null : s.trim())),
  lastName: z
    .string()
    .max(80)
    .transform((s) => (s.trim().length === 0 ? null : s.trim())),
  phone: z
    .string()
    .max(30)
    .transform((s) => (s.trim().length === 0 ? null : s.trim())),
  address: z
    .string()
    .max(200)
    .transform((s) => (s.trim().length === 0 ? null : s.trim())),
  city: z
    .string()
    .max(80)
    .transform((s) => (s.trim().length === 0 ? null : s.trim())),
  country: z
    .string()
    .max(80)
    .transform((s) => (s.trim().length === 0 ? null : s.trim())),
});

export type UpdateAccountProfileResult =
  | { ok: true }
  | { ok: false; error: string };

export const updateAccountProfileAction = async (
  formData: FormData,
): Promise<UpdateAccountProfileResult> => {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You must be signed in." };
  }

  const parsed = profileUpdateSchema.safeParse({
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    address: String(formData.get("address") ?? ""),
    city: String(formData.get("city") ?? ""),
    country: String(formData.get("country") ?? ""),
  });

  if (!parsed.success) {
    return { ok: false, error: "Invalid profile fields." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone,
      address: parsed.data.address,
      city: parsed.data.city,
      country: parsed.data.country,
    },
  });

  return { ok: true };
};

export type UploadAccountProfileImageResult =
  | { ok: true }
  | { ok: false; error: string };

export const uploadAccountProfileImageAction = async (
  formData: FormData,
): Promise<UploadAccountProfileImageResult> => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "You must be signed in." };
    }

    const file = formData.get("profileImage");
    if (!file || typeof file === "string" || file.size === 0) {
      return {
        ok: false,
        error: SITE_HEADER.accountPopoverProfileImageInvalid,
      };
    }

    if (file.size > PROFILE_IMAGE_MAX_BYTES) {
      return {
        ok: false,
        error: SITE_HEADER.accountPopoverProfileImageTooLarge,
      };
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const validated = validateProfileImageBuffer(buf);
    if (!validated.ok) {
      return {
        ok: false,
        error: SITE_HEADER.accountPopoverProfileImageInvalid,
      };
    }

    const ext = extensionForProfileImageKind(validated.kind);
    const fileName = `${randomUUID()}.${ext}`;

    const previous = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { profileImagePath: true },
    });

    const blobToken = blobReadWriteToken();
    let webPath: string;
    let diskPath: string | null = null;

    if (blobToken) {
      const blobKey = `profile-images/${session.user.id}/${fileName}`;
      let uploadedUrl: string;
      try {
        const blob = await put(blobKey, buf, {
          access: "public",
          token: blobToken,
          contentType: contentTypeForProfileImageKind(validated.kind),
        });
        uploadedUrl = blob.url;
      } catch (error) {
        console.error("profile-image blob upload failed", {
          userId: session.user.id,
          hasBlobToken: Boolean(blobToken),
          error,
        });
        return {
          ok: false,
          error: SITE_HEADER.accountPopoverProfileImageUploadFailed,
        };
      }
      webPath = uploadedUrl;
      try {
        await prisma.user.update({
          where: { id: session.user.id },
          data: { profileImagePath: webPath },
        });
      } catch (error) {
        console.error("profile-image db update failed after blob upload", {
          userId: session.user.id,
          uploadedUrl,
          error,
        });
        await del(uploadedUrl, { token: blobToken }).catch(() => undefined);
        return {
          ok: false,
          error: SITE_HEADER.accountPopoverProfileImageUploadFailed,
        };
      }
    } else if (isVercelRuntime()) {
      return {
        ok: false,
        error: SITE_HEADER.accountPopoverProfileImageBlobRequiredOnVercel,
      };
    } else {
      const dirAbs = path.join(process.cwd(), PROFILE_UPLOAD_DIR);
      await mkdir(dirAbs, { recursive: true });
      diskPath = path.join(dirAbs, fileName);
      webPath = `${PROFILE_UPLOAD_WEB_PREFIX}/${fileName}`;

      try {
        await writeFile(diskPath, buf);
      } catch (error) {
        console.error("profile-image local write failed", {
          userId: session.user.id,
          diskPath,
          error,
        });
        return {
          ok: false,
          error: SITE_HEADER.accountPopoverProfileImageUploadFailed,
        };
      }

      try {
        await prisma.user.update({
          where: { id: session.user.id },
          data: { profileImagePath: webPath },
        });
      } catch (error) {
        console.error("profile-image db update failed after local write", {
          userId: session.user.id,
          webPath,
          error,
        });
        await unlink(diskPath).catch(() => undefined);
        return {
          ok: false,
          error: SITE_HEADER.accountPopoverProfileImageUploadFailed,
        };
      }
    }

    const oldWeb = previous?.profileImagePath ?? null;
    if (oldWeb) {
      if (isVercelBlobPublicStorageUrl(oldWeb)) {
        const t = blobReadWriteToken();
        if (t) {
          setImmediate(() => {
            del(oldWeb, { token: t }).catch(() => undefined);
          });
        }
      } else {
        const oldAbs = resolveSafeProfileImageDiskPath(oldWeb);
        if (oldAbs && oldAbs !== diskPath) {
          /** Defer unlink so the dev server / browser can finish serving the old URL before delete (reduces Windows lock + flaky second uploads). */
          setImmediate(() => {
            unlink(oldAbs).catch(() => undefined);
          });
        }
      }
    }

    return { ok: true };
  } catch (error) {
    console.error("profile-image action failed", { error });
    return {
      ok: false,
      error: SITE_HEADER.accountPopoverProfileImageUploadFailed,
    };
  }
};

const updatePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Current password is required."),
    newPassword: signupPasswordSchema,
    confirmNewPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords don't match.",
    path: ["confirmNewPassword"],
  });

export type UpdateAccountPasswordResult =
  | { ok: true }
  | { ok: false; error: string };

export const updateAccountPasswordAction = async (
  formData: FormData,
): Promise<UpdateAccountPasswordResult> => {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You must be signed in." };
  }

  const parsed = updatePasswordSchema.safeParse({
    oldPassword: String(formData.get("oldPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmNewPassword: String(formData.get("confirmNewPassword") ?? ""),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid password fields.",
    };
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });

  if (!currentUser?.password) {
    return { ok: false, error: "Could not verify your current password." };
  }

  const isOldPasswordValid = await verifyPassword(
    parsed.data.oldPassword,
    currentUser.password,
  );
  if (!isOldPasswordValid) {
    return { ok: false, error: "Current password is incorrect." };
  }

  const nextPasswordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: nextPasswordHash },
  });

  return { ok: true };
};

const checkoutOrderItemSchema = z.object({
  productId: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(100),
  selectedColor: z.string().max(120).nullable().optional(),
  selectedStorage: z.string().max(120).nullable().optional(),
});

const checkoutPlaceOrderSchema = z.object({
  createAccount: z.boolean().optional().default(false),
  email: z.string().trim().email().max(254),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(1).max(40),
  address: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(80),
  country: z.string().trim().min(1).max(80),
  paymentMethod: z.enum(CHECKOUT_PAYMENT_METHODS).default("cod"),
  items: z.array(checkoutOrderItemSchema).min(1).max(100),
  voucherCode: z
    .string()
    .max(40)
    .optional()
    .default("")
    .transform((raw) => {
      const t = raw.trim().toUpperCase();
      return t.length === 0 ? undefined : t;
    }),
});

export type PlaceCheckoutOrderInput = z.input<typeof checkoutPlaceOrderSchema>;
export type PlaceCheckoutOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

const previewCartVoucherSchema = z.object({
  code: z.string().trim().min(1, "Enter a voucher code.").max(40),
  cartNetSubtotal: z.number().finite().min(0).max(50_000_000),
});

export type PreviewCartVoucherResult =
  | { ok: true; appliedAmount: number; code: string; name: string }
  | { ok: false; error: string };

/**
 * Preview-only: uses client-supplied cart net for display. Checkout always
 * recomputes the voucher from server line totals + DB rules.
 */
export const previewCartVoucherAction = async (
  input: unknown,
): Promise<PreviewCartVoucherResult> => {
  const parsed = previewCartVoucherSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid voucher request.",
    };
  }
  return resolveCartVoucher(
    prisma,
    parsed.data.code,
    parsed.data.cartNetSubtotal,
  );
};

const findVariantDelta = (
  value: string | null | undefined,
  options: ReadonlyArray<{ value: string; priceDelta: number }>,
):
  | { ok: true; normalizedValue: string | null; priceDelta: number }
  | { ok: false } => {
  if (!value) {
    return options.length > 0
      ? { ok: false }
      : { ok: true, normalizedValue: null, priceDelta: 0 };
  }
  if (options.length === 0) {
    return { ok: true, normalizedValue: null, priceDelta: 0 };
  }
  const normalized = value.trim().toLowerCase();
  const match = options.find(
    (option) => option.value.trim().toLowerCase() === normalized,
  );
  if (!match) return { ok: false };
  return {
    ok: true,
    normalizedValue: match.value,
    priceDelta: match.priceDelta,
  };
};

/**
 * <SECURITY_REVIEW>
 * Vulnerability audit:
 * - Auth bypass: guest checkout intentionally allowed; order is linked by email
 *   to an existing user or an auto-created user account.
 * - SQL injection: Prisma query builder only; no raw SQL.
 * - Client price tampering: server recomputes item prices/discounts from Product rows.
 * - Stock race/oversell: stock checked and decremented inside one transaction.
 * - Input abuse: strict Zod validation on billing fields and item payload.
 *
 * Mitigations applied:
 * - Fail-closed on missing/invalid session or malformed payload.
 * - Ignore client-provided totals and derive all monetary values server-side.
 * - Cart vouchers: code is echoed from the client but the discount amount is
 *   recomputed inside the transaction from line totals + `Discount` row rules.
 * - Update user profile address fields in same transaction as order creation.
 *
 * Verification test case:
 * - Authenticated user places order with valid cart => Order + OrderItems created,
 *   stock decremented, and `User.address/city/country` updated.
 * - Tampered payload with mismatched variant values => action returns `{ ok:false }`.
 * </SECURITY_REVIEW>
 */
export const placeCheckoutOrderAction = async (
  input: PlaceCheckoutOrderInput,
): Promise<PlaceCheckoutOrderResult> => {
  const parsed = checkoutPlaceOrderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid checkout details.",
    };
  }

  const {
    createAccount,
    firstName,
    lastName,
    phone,
    address,
    city,
    country,
    paymentMethod,
    items,
    voucherCode,
  } = parsed.data;
  const normalizedEmail = parsed.data.email.toLowerCase().trim();
  const dbPaymentMethod = checkoutToDbPaymentMethod(paymentMethod);

  try {
    const order = await prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, autoCreated: true },
      });

      if (!user) {
        const generatedPasswordHash = await hashPassword(randomUUID());
        user = await tx.user.create({
          data: {
            email: normalizedEmail,
            password: generatedPasswordHash,
            firstName,
            lastName,
            phone,
            address,
            city,
            country,
            role: "USER",
            status: createAccount ? "ACTIVE" : "INACTIVE",
            autoCreated: !createAccount,
          },
          select: { id: true, autoCreated: true },
        });
      } else {
        await tx.user.update({
          where: { id: user.id },
          data: {
            firstName,
            lastName,
            phone,
            address,
            city,
            country,
            ...(createAccount
              ? { autoCreated: false, status: "ACTIVE" as const }
              : {}),
          },
        });
      }

      const productIds = [...new Set(items.map((item) => item.productId))];
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          stock: true,
          isActive: true,
          price: true,
          discountType: true,
          discountValue: true,
          isDiscountActive: true,
          colorOptions: true,
          storageOptions: true,
        },
      });
      const productById = new Map(
        products.map((product) => [product.id, product]),
      );

      const stockNeeded = new Map<string, number>();
      for (const item of items) {
        stockNeeded.set(
          item.productId,
          (stockNeeded.get(item.productId) ?? 0) + item.quantity,
        );
      }

      let subtotal = 0;
      let discountAmount = 0;
      const lines: Array<{
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: string;
        discountPercent: string;
        discountedPrice: string;
        selectedColor: string | null;
        selectedStorage: string | null;
        colorPriceDelta: string;
        storagePriceDelta: string;
        lineTotal: string;
      }> = [];

      for (const item of items) {
        const product = productById.get(item.productId);
        if (!product || !product.isActive) {
          throw new Error("One or more products are no longer available.");
        }

        const available = product.stock;
        const needed = stockNeeded.get(item.productId) ?? item.quantity;
        if (available < needed) {
          throw new Error(`Not enough stock for "${product.name}".`);
        }

        const colorOptions = colorOptionsJsonToList(product.colorOptions);
        const storageOptions = storageOptionsJsonToList(product.storageOptions);
        const color = findVariantDelta(
          item.selectedColor ?? null,
          colorOptions,
        );
        const storage = findVariantDelta(
          item.selectedStorage ?? null,
          storageOptions,
        );
        if (!color.ok || !storage.ok) {
          throw new Error(
            `Selected variants are not valid for "${product.name}".`,
          );
        }

        const baseUnitPrice = Number(product.price);
        const discountedBasePrice = finalProductPrice({
          price: baseUnitPrice,
          discountType: product.discountType,
          discountValue:
            product.discountValue === null
              ? null
              : Number(product.discountValue),
          isDiscountActive: product.isDiscountActive,
        });
        const unitPriceWithVariant =
          baseUnitPrice + color.priceDelta + storage.priceDelta;
        const discountedUnitWithVariant =
          discountedBasePrice + color.priceDelta + storage.priceDelta;
        const lineSubtotal = unitPriceWithVariant * item.quantity;
        const lineTotal = discountedUnitWithVariant * item.quantity;
        const lineDiscount = Math.max(0, lineSubtotal - lineTotal);
        const discountPercent =
          baseUnitPrice > 0
            ? Math.max(
                0,
                ((baseUnitPrice - discountedBasePrice) / baseUnitPrice) * 100,
              )
            : 0;

        subtotal += lineSubtotal;
        discountAmount += lineDiscount;
        lines.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: baseUnitPrice.toFixed(2),
          discountPercent: discountPercent.toFixed(2),
          discountedPrice: discountedBasePrice.toFixed(2),
          selectedColor: color.normalizedValue,
          selectedStorage: storage.normalizedValue,
          colorPriceDelta: color.priceDelta.toFixed(2),
          storagePriceDelta: storage.priceDelta.toFixed(2),
          lineTotal: lineTotal.toFixed(2),
        });
      }

      const cartNetSubtotal =
        Math.round((subtotal - discountAmount) * 100) / 100;

      let voucherDiscountAmountNum = 0;
      let voucherCodeForOrder: string | null = null;
      let voucherNameForOrder: string | null = null;
      if (voucherCode) {
        const voucherResult = await resolveCartVoucher(
          tx,
          voucherCode,
          cartNetSubtotal,
        );
        if (!voucherResult.ok) {
          throw new Error(voucherResult.error);
        }
        voucherDiscountAmountNum = voucherResult.appliedAmount;
        voucherCodeForOrder = voucherResult.code;
        voucherNameForOrder = voucherResult.name;
      }

      const orderTotalNum =
        Math.round(
          (cartNetSubtotal - voucherDiscountAmountNum + Number.EPSILON) * 100,
        ) / 100;
      if (orderTotalNum < 0) {
        throw new Error(
          "Order total became invalid after applying the voucher.",
        );
      }

      const createdOrder = await tx.order.create({
        data: {
          userId: user.id,
          paymentMethod: dbPaymentMethod,
          subtotal: subtotal.toFixed(2),
          discountAmount: discountAmount.toFixed(2),
          voucherCode: voucherCodeForOrder,
          voucherName: voucherNameForOrder,
          voucherDiscountAmount: voucherDiscountAmountNum.toFixed(2),
          totalAmount: orderTotalNum.toFixed(2),
          items: {
            create: lines,
          },
        },
        select: { id: true },
      });

      for (const [productId, quantity] of stockNeeded) {
        await tx.product.update({
          where: { id: productId },
          data: { stock: { decrement: quantity } },
        });
      }

      return createdOrder;
    });

    return { ok: true, orderId: order.id };
  } catch (error) {
    console.error("placeCheckoutOrderAction failed", { error });
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Could not place order. Please try again.";
    return { ok: false, error: message };
  }
};
