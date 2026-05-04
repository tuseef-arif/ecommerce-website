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

const passwordResetEmailSendUserMessage = (
  hint?: Extract<
    Awaited<ReturnType<typeof sendPasswordResetEmail>>,
    { ok: false }
  >["kind"],
): string => {
  switch (hint) {
    case "MISSING_RESEND_API_KEY":
      return "Add RESEND_API_KEY to .env.local, or switch to SMTP with EMAIL_PROVIDER=smtp and set SMTP_* variables. Restart npm run dev after saving.";
    case "MISSING_SMTP_CONFIG":
      return "EMAIL_PROVIDER is smtp but SMTP is incomplete. Set SMTP_HOST, SMTP_USER, and SMTP_PASS (and usually SMTP_PORT). Restart npm run dev.";
    case "MISSING_FROM":
      return "Set PASSWORD_RESET_EMAIL_FROM (or SMTP_FROM), then restart npm run dev.";
    case "PROVIDER_REJECTED":
      return "The mail provider rejected the reset email. Check server logs for [sendPasswordResetEmail].";
    case "NETWORK_ERROR":
      return "Could not reach the email provider. Check your internet connection and try again.";
    default:
      return "We could not send the reset email right now. Please try again in a moment.";
  }
};

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

export type CompletePasswordResetState = {
  errorMessage: string | null;
};

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
    select: { id: true, email: true, firstName: true, lastName: true },
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
  const resetUrl = `${origin}/?authView=reset-password&token=${encodeURIComponent(rawToken)}`;

  const sendResult = await sendPasswordResetEmail({
    to: user.email,
    resetUrl,
    firstName: user.firstName,
    lastName: user.lastName,
  });
  if (!sendResult.ok) {
    return {
      errorMessage: passwordResetEmailSendUserMessage(sendResult.kind),
      success: false,
    };
  }

  return { errorMessage: null, success: true };
};

export const completePasswordResetAction = async (
  _prev: CompletePasswordResetState,
  formData: FormData,
): Promise<CompletePasswordResetState> => {
  const tokenRaw = String(formData.get("token") ?? "");

  const parsed = completeResetSchema.safeParse({
    token: tokenRaw,
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      errorMessage: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const tokenHash = hashResetToken(parsed.data.token);

  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true },
  });

  if (!row || row.expiresAt.getTime() < Date.now()) {
    return {
      errorMessage: "This reset link is invalid or has expired.",
    };
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

  redirect("/?authView=login&authNotice=password_reset_success");
};
