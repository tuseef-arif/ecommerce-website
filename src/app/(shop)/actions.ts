"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SITE_ROUTES } from "@/lib/config/site-config";

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
