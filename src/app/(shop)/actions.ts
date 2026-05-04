"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SITE_ROUTES } from "@/lib/config/site-config";
import { hashPassword, verifyPassword } from "@/lib/password";
import { signupPasswordSchema } from "@/lib/validation/signup-password-schema";

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
