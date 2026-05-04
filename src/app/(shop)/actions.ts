"use server";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
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
  extensionForProfileImageKind,
  validateProfileImageBuffer,
} from "@/lib/validate-profile-image";

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

const sessionCookieNames = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
] as const;

const clearSessionCookies = async () => {
  const cookieStore = await cookies();
  for (const cookieName of sessionCookieNames) {
    cookieStore.delete(cookieName);
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
    const dirAbs = path.join(process.cwd(), PROFILE_UPLOAD_DIR);
    await mkdir(dirAbs, { recursive: true });
    const diskPath = path.join(dirAbs, fileName);
    const webPath = `${PROFILE_UPLOAD_WEB_PREFIX}/${fileName}`;

    const previous = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { profileImagePath: true },
    });

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

    const oldWeb = previous?.profileImagePath ?? null;
    if (oldWeb) {
      const oldAbs = resolveSafeProfileImageDiskPath(oldWeb);
      if (oldAbs && oldAbs !== diskPath) {
        /** Defer unlink so the dev server / browser can finish serving the old URL before delete (reduces Windows lock + flaky second uploads). */
        setImmediate(() => {
          unlink(oldAbs).catch(() => undefined);
        });
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
