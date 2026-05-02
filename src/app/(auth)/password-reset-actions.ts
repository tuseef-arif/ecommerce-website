"use server";

import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sendPasswordResetEmail } from "@/lib/auth/password-reset-email";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/config/site-config";
import type { RequestPasswordResetPopoverState } from "./password-reset-popover-state";

const requestEmailSchema = z.string().email("Please enter a valid email.");

const completeResetSchema = z
  .object({
    token: z.string().min(16, "Invalid reset link."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long.")
      .max(72, "Password is too long."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

const getPasswordResetOrigin = (): string => {
  const raw =
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    SITE_URL;
  return raw.replace(/\/+$/, "");
};

const hashResetToken = (raw: string): string =>
  createHash("sha256").update(raw, "utf8").digest("hex");

export const requestPasswordResetInlineAction = async (
  _prev: RequestPasswordResetPopoverState,
  formData: FormData,
): Promise<RequestPasswordResetPopoverState> => {
  const parsed = requestEmailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return {
      errorMessage: parsed.error.issues[0]?.message ?? "Invalid email.",
      success: false,
    };
  }

  const email = parsed.data.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (!user) {
    return { errorMessage: null, success: true };
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await tx.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });
  });

  const origin = getPasswordResetOrigin();
  const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(rawToken)}`;

  await sendPasswordResetEmail({ to: user.email, resetUrl });

  return { errorMessage: null, success: true };
};

export const completePasswordResetAction = async (formData: FormData) => {
  const tokenRaw = String(formData.get("token") ?? "");

  const parsed = completeResetSchema.safeParse({
    token: tokenRaw,
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const msg = encodeURIComponent(
      parsed.error.issues[0]?.message ?? "Invalid input.",
    );
    const tokenQuery =
      tokenRaw.length > 0
        ? `token=${encodeURIComponent(tokenRaw)}&error=${msg}`
        : `error=${msg}`;
    redirect(`/reset-password?${tokenQuery}`);
  }

  const tokenHash = hashResetToken(parsed.data.token);

  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true },
  });

  if (!row || row.expiresAt.getTime() < Date.now()) {
    redirect(
      "/reset-password?error=This reset link is invalid or has expired.",
    );
  }

  const newPassword = await hashPassword(parsed.data.password);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: row.userId },
      data: { password: newPassword },
    });
    await tx.passwordResetToken.delete({ where: { id: row.id } });
    await tx.passwordResetToken.deleteMany({ where: { userId: row.userId } });
  });

  redirect(
    "/login?success=Your%20password%20was%20updated.%20Sign%20in%20below.",
  );
};
