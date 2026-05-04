import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import type { RegisterAccountInput } from "@/lib/validation/register-account-schema";
import {
  generateSignupOtpCode,
  hashSignupOtpCode,
  SIGNUP_OTP_MAX_ATTEMPTS,
  SIGNUP_OTP_TTL_MS,
} from "@/lib/auth/signup-otp";
import type { MailSendResult } from "@/lib/auth/mail-transport";
import { sendSignupOtpEmail } from "@/lib/auth/signup-otp-email";

export type StartSignupDbFailureHint =
  | "MIGRATION_OR_TABLE"
  | "CONNECTION"
  | "POOLER_PREPARED_STATEMENT"
  | "GENERIC";

export type StartSignupOtpResult =
  | { ok: true }
  | {
      ok: false;
      error: "EMAIL_TAKEN" | "EMAIL_SEND_FAILED" | "DATABASE" | "UNKNOWN";
      /** Safe category for user-facing copy (no raw DB text). */
      dbHint?: StartSignupDbFailureHint;
      /** Why mail / env failed (only when error is EMAIL_SEND_FAILED). */
      emailSendHint?: Extract<MailSendResult, { ok: false }>["kind"];
    };

const classifySignupDbError = (err: unknown): StartSignupDbFailureHint => {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  if (
    /p2021|does not exist|relation\s+["']?signupotpchallenge/i.test(msg) ||
    lower.includes("signupotpchallenge")
  ) {
    return "MIGRATION_OR_TABLE";
  }
  if (
    /p1001|econnrefused|etimedout|getaddrinfo|connect\s+timeout|password authentication failed/i.test(
      msg,
    )
  ) {
    return "CONNECTION";
  }
  if (/prepared statement|26000|42p01.*already exists/i.test(lower)) {
    return "POOLER_PREPARED_STATEMENT";
  }
  return "GENERIC";
};

export type CompleteSignupOtpResult =
  | { ok: true }
  | {
      ok: false;
      error:
        | "NOT_FOUND"
        | "EXPIRED"
        | "LOCKED"
        | "INVALID_CODE"
        | "EMAIL_TAKEN"
        | "UNKNOWN";
    };

export type ResendSignupOtpResult =
  | { ok: true }
  | {
      ok: false;
      error: "NOT_FOUND" | "EXPIRED" | "EMAIL_SEND_FAILED" | "DATABASE";
      dbHint?: StartSignupDbFailureHint;
      emailSendHint?: Extract<MailSendResult, { ok: false }>["kind"];
    };

/**
 * Stores a pending signup and sends a 6-digit OTP to the email address.
 */
export const startSignupEmailVerification = async (
  data: RegisterAccountInput,
): Promise<StartSignupOtpResult> => {
  const email = data.email.toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return { ok: false, error: "EMAIL_TAKEN" };
  }

  const plainOtp = generateSignupOtpCode();
  const codeHash = hashSignupOtpCode(plainOtp);
  const passwordHash = await hashPassword(data.password);
  const expiresAt = new Date(Date.now() + SIGNUP_OTP_TTL_MS);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.signupOtpChallenge.deleteMany({ where: { email } });
      await tx.signupOtpChallenge.create({
        data: {
          email,
          codeHash,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          expiresAt,
        },
      });
    });
  } catch (err) {
    const hint = classifySignupDbError(err);
    console.error(
      "[startSignupEmailVerification] failed to save SignupOtpChallenge:",
      hint,
      err instanceof Error ? err.message : err,
    );
    return { ok: false, error: "DATABASE", dbHint: hint };
  }

  const sent = await sendSignupOtpEmail({
    to: email,
    code: plainOtp,
    firstName: data.firstName,
    lastName: data.lastName,
  });
  if (!sent.ok) {
    await prisma.signupOtpChallenge
      .deleteMany({ where: { email } })
      .catch(() => {});
    return {
      ok: false,
      error: "EMAIL_SEND_FAILED",
      emailSendHint: sent.kind,
    };
  }

  return { ok: true };
};

/**
 * Replaces the existing OTP with a new one and sends it.
 * Any previous OTP becomes invalid immediately.
 */
export const resendSignupEmailVerification = async (
  emailRaw: string,
): Promise<ResendSignupOtpResult> => {
  const email = emailRaw.trim().toLowerCase();
  const plainOtp = generateSignupOtpCode();
  const codeHash = hashSignupOtpCode(plainOtp);
  const expiresAt = new Date(Date.now() + SIGNUP_OTP_TTL_MS);
  let challengeFirstName: string | null = null;
  let challengeLastName: string | null = null;

  try {
    const row = await prisma.signupOtpChallenge.findUnique({
      where: { email },
      select: { id: true, expiresAt: true, firstName: true, lastName: true },
    });

    if (!row) {
      return { ok: false, error: "NOT_FOUND" };
    }

    if (row.expiresAt.getTime() < Date.now()) {
      await prisma.signupOtpChallenge.delete({ where: { id: row.id } });
      return { ok: false, error: "EXPIRED" };
    }

    await prisma.signupOtpChallenge.update({
      where: { id: row.id },
      data: {
        codeHash,
        expiresAt,
        attemptCount: 0,
      },
    });
    challengeFirstName = row.firstName;
    challengeLastName = row.lastName;
  } catch (err) {
    const hint = classifySignupDbError(err);
    console.error(
      "[resendSignupEmailVerification] failed to update SignupOtpChallenge:",
      hint,
      err instanceof Error ? err.message : err,
    );
    return { ok: false, error: "DATABASE", dbHint: hint };
  }

  const sent = await sendSignupOtpEmail({
    to: email,
    code: plainOtp,
    firstName: challengeFirstName,
    lastName: challengeLastName,
  });
  if (!sent.ok) {
    return {
      ok: false,
      error: "EMAIL_SEND_FAILED",
      emailSendHint: sent.kind,
    };
  }

  return { ok: true };
};

/**
 * Validates OTP and creates the user. Deletes the challenge on success.
 */
export const completeSignupWithOtp = async (
  emailRaw: string,
  otpRaw: string,
): Promise<CompleteSignupOtpResult> => {
  const email = emailRaw.trim().toLowerCase();
  const trimmedOtp = otpRaw.trim();
  const codeHash = hashSignupOtpCode(trimmedOtp);

  try {
    return await prisma.$transaction(async (tx) => {
      const row = await tx.signupOtpChallenge.findUnique({
        where: { email },
      });

      if (!row) {
        return { ok: false, error: "NOT_FOUND" };
      }

      if (row.expiresAt.getTime() < Date.now()) {
        await tx.signupOtpChallenge.delete({ where: { id: row.id } });
        return { ok: false, error: "EXPIRED" };
      }

      if (row.attemptCount >= SIGNUP_OTP_MAX_ATTEMPTS) {
        await tx.signupOtpChallenge.delete({ where: { id: row.id } });
        return { ok: false, error: "LOCKED" };
      }

      const expected = Buffer.from(row.codeHash, "hex");
      const actual = Buffer.from(codeHash, "hex");
      const codeMatches =
        expected.length === actual.length && timingSafeEqual(expected, actual);

      if (!codeMatches) {
        await tx.signupOtpChallenge.update({
          where: { id: row.id },
          data: { attemptCount: { increment: 1 } },
        });
        return { ok: false, error: "INVALID_CODE" };
      }

      const taken = await tx.user.findUnique({
        where: { email: row.email },
        select: { id: true },
      });

      if (taken) {
        await tx.signupOtpChallenge.delete({ where: { id: row.id } });
        return { ok: false, error: "EMAIL_TAKEN" };
      }

      await tx.user.create({
        data: {
          email: row.email,
          password: row.passwordHash,
          firstName: row.firstName,
          lastName: row.lastName,
          phone: row.phone,
        },
      });

      await tx.signupOtpChallenge.delete({ where: { id: row.id } });
      return { ok: true };
    });
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }
};
