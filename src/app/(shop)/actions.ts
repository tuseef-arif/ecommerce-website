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
import { signupPasswordSchema } from "@/lib/validation/signup-password-schema";
import {
  PROFILE_IMAGE_MAX_BYTES,
  type ProfileImageKind,
  extensionForProfileImageKind,
  validateProfileImageBuffer,
} from "@/lib/validate-profile-image";

const blobReadWriteToken = (): string | undefined =>
  process.env.BLOB_READ_WRITE_TOKEN?.trim() || undefined;

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
      } catch {
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
      } catch {
        await del(uploadedUrl, { token: blobToken }).catch(() => undefined);
        return {
          ok: false,
          error: SITE_HEADER.accountPopoverProfileImageUploadFailed,
        };
      }
    } else if (process.env.VERCEL === "1") {
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
      } catch {
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
      } catch {
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
  } catch {
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
