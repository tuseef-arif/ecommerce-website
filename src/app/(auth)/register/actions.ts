"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  completeSignupWithOtp,
  resendSignupEmailVerification,
  startSignupEmailVerification,
} from "@/lib/auth/signup-otp-service";
import type { MailSendResult } from "@/lib/auth/mail-transport";
import type { StartSignupDbFailureHint } from "@/lib/auth/signup-otp-service";
import { registerOtpCodeSchema } from "@/lib/validation/register-otp-code-schema";
import { registerAccountSchema } from "@/lib/validation/register-account-schema";
import { SITE_ROUTES } from "@/lib/config/site-config";
import type { RegisterPopoverState } from "./register-popover-state";

const verifyEmailFieldSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Please enter a valid email.");

const signupEmailSendUserMessage = (
  hint?: Extract<MailSendResult, { ok: false }>["kind"],
): string => {
  switch (hint) {
    case "MISSING_RESEND_API_KEY":
      return "Add RESEND_API_KEY to .env.local (Resend dashboard → API Keys), or switch to SMTP with EMAIL_PROVIDER=smtp and set SMTP_* variables. Restart npm run dev after saving.";
    case "MISSING_SMTP_CONFIG":
      return "EMAIL_PROVIDER is smtp but SMTP is incomplete. Set SMTP_HOST, SMTP_USER, and SMTP_PASS (and usually SMTP_PORT). For Gmail use an App Password. Restart npm run dev.";
    case "MISSING_FROM":
      return "Set a sender address: SIGNUP_OTP_EMAIL_FROM or PASSWORD_RESET_EMAIL_FROM (or SMTP_FROM for SMTP). Example: SIGNUP_OTP_EMAIL_FROM=My Store <you@gmail.com> — then restart npm run dev.";
    case "PROVIDER_REJECTED":
      return "The mail server rejected the send (wrong password, blocked sender, or policy). Check the server terminal for [sendSignupOtpEmail] or [sendTransactionalHtmlEmail] logs.";
    case "NETWORK_ERROR":
      return "Could not reach the email API (network or DNS). Check your internet connection and try again.";
    default:
      return "We could not send the verification email. For Resend: RESEND_API_KEY + From address. For Gmail SMTP: EMAIL_PROVIDER=smtp and SMTP_* — see project mail-transport. Restart the server.";
  }
};

const signupDatabaseUserMessage = (hint?: StartSignupDbFailureHint): string => {
  switch (hint) {
    case "MIGRATION_OR_TABLE":
      return "Could not save your sign-up step: the database is missing the sign-up verification table. Run: npx prisma migrate deploy — then stop and start npm run dev again. Use the same DATABASE_URL you used for migrate.";
    case "CONNECTION":
      return "Could not reach the database. Check DATABASE_URL in .env.local (server must see it), confirm PostgreSQL is running, then restart npm run dev.";
    case "POOLER_PREPARED_STATEMENT":
      return "Database connection error (often transaction pooler). Use a direct/session Postgres URL for DATABASE_URL (e.g. Supabase port 5432), not the transaction pooler (often port 6543), then restart the dev server.";
    default:
      return "Could not save your sign-up step. Run: npx prisma migrate deploy, confirm DATABASE_URL, run: npx prisma generate, then fully restart npm run dev. Check the server terminal for: [startSignupEmailVerification]";
  }
};

export const completeRegisterWithOtpAction = async (formData: FormData) => {
  const emailParsed = verifyEmailFieldSchema.safeParse(formData.get("email"));

  const combined = z
    .object({
      email: verifyEmailFieldSchema,
      code: registerOtpCodeSchema,
    })
    .safeParse({
      email: formData.get("email"),
      code: formData.get("code"),
    });

  if (!combined.success) {
    const msg = encodeURIComponent(
      combined.error.issues[0]?.message ?? "Invalid input.",
    );
    const emailQ =
      emailParsed.success && emailParsed.data.length > 0
        ? `email=${encodeURIComponent(emailParsed.data.toLowerCase())}&`
        : "";
    redirect(`${SITE_ROUTES.registerVerifyEmail}?${emailQ}error=${msg}`);
  }

  const email = combined.data.email.toLowerCase();
  const result = await completeSignupWithOtp(email, combined.data.code);

  if (!result.ok) {
    const emailQuery = `email=${encodeURIComponent(email)}`;
    if (result.error === "INVALID_CODE" || result.error === "NOT_FOUND") {
      redirect(
        `${SITE_ROUTES.registerVerifyEmail}?${emailQuery}&error=${encodeURIComponent("Invalid or Expired code. Please request a new code.")}`,
      );
    }
    if (result.error === "EXPIRED") {
      redirect(
        `/register?error=${encodeURIComponent("This verification code has expired. Please register again.")}`,
      );
    }
    if (result.error === "LOCKED") {
      redirect(
        `/register?error=${encodeURIComponent("Too many incorrect attempts. Please register again.")}`,
      );
    }
    if (result.error === "EMAIL_TAKEN") {
      redirect(
        `/register?error=${encodeURIComponent("That email was registered in the meantime. Try signing in.")}`,
      );
    }
    redirect(
      `${SITE_ROUTES.registerVerifyEmail}?${emailQuery}&error=${encodeURIComponent("Something went wrong. Please try again.")}`,
    );
  }

  redirect("/login?success=Account%20created%20successfully.&authFlow=signup");
};

/**
 * Registration for the header account popover — OTP flow with `flow` hidden field.
 */
export const registerAccountInlineAction = async (
  prev: RegisterPopoverState,
  formData: FormData,
): Promise<RegisterPopoverState> => {
  const flowRaw = String(formData.get("flow") ?? "details");

  if (flowRaw === "start_over") {
    return {
      flow: "details",
      errorMessage: null,
      success: false,
      pendingEmail: undefined,
      emailForLogin: undefined,
    };
  }

  if (flowRaw === "resend_otp") {
    const emailParsed = verifyEmailFieldSchema.safeParse(formData.get("email"));
    if (!emailParsed.success) {
      return {
        flow: "details",
        errorMessage: "Please enter your email to continue.",
        success: false,
        pendingEmail: undefined,
        emailForLogin: undefined,
      };
    }

    const email = emailParsed.data.toLowerCase();
    const result = await resendSignupEmailVerification(email);

    if (!result.ok) {
      if (result.error === "NOT_FOUND" || result.error === "EXPIRED") {
        return {
          flow: "details",
          errorMessage:
            "Your verification session has expired. Please submit your sign-up details again.",
          success: false,
          pendingEmail: undefined,
          emailForLogin: undefined,
        };
      }
      if (result.error === "EMAIL_SEND_FAILED") {
        return {
          flow: "verify_otp",
          errorMessage: signupEmailSendUserMessage(result.emailSendHint),
          success: false,
          pendingEmail: email,
          emailForLogin: undefined,
        };
      }
      return {
        flow: "verify_otp",
        errorMessage: signupDatabaseUserMessage(result.dbHint),
        success: false,
        pendingEmail: email,
        emailForLogin: undefined,
      };
    }

    return {
      flow: "verify_otp",
      errorMessage: "A new OTP has been sent. Please check your email.",
      success: false,
      pendingEmail: email,
      emailForLogin: undefined,
    };
  }

  if (flowRaw === "verify_otp") {
    const emailParsed = verifyEmailFieldSchema.safeParse(formData.get("email"));
    const combined = z
      .object({
        email: verifyEmailFieldSchema,
        code: registerOtpCodeSchema,
      })
      .safeParse({
        email: formData.get("email"),
        code: formData.get("code"),
      });

    if (!combined.success) {
      return {
        flow: "verify_otp",
        errorMessage:
          combined.error.issues[0]?.message ??
          "Please check the code and try again.",
        success: false,
        pendingEmail: emailParsed.success
          ? emailParsed.data.toLowerCase()
          : undefined,
        emailForLogin: undefined,
      };
    }

    const email = combined.data.email.toLowerCase();
    const result = await completeSignupWithOtp(email, combined.data.code);

    if (!result.ok) {
      if (result.error === "INVALID_CODE" || result.error === "NOT_FOUND") {
        return {
          flow: "verify_otp",
          errorMessage: "Invalid or Expired code. Please request a new code.",
          success: false,
          pendingEmail: email,
          emailForLogin: undefined,
        };
      }
      if (result.error === "EXPIRED") {
        return {
          flow: "details",
          errorMessage:
            "This verification code has expired. Please submit your details again.",
          success: false,
          pendingEmail: undefined,
          emailForLogin: undefined,
        };
      }
      if (result.error === "LOCKED") {
        return {
          flow: "details",
          errorMessage:
            "Too many incorrect attempts. Please register again from the start.",
          success: false,
          pendingEmail: undefined,
          emailForLogin: undefined,
        };
      }
      if (result.error === "EMAIL_TAKEN") {
        return {
          flow: "details",
          errorMessage:
            "That email is already registered. Try signing in instead.",
          success: false,
          pendingEmail: undefined,
          emailForLogin: undefined,
        };
      }
      return {
        flow: "verify_otp",
        errorMessage: "Something went wrong. Please try again.",
        success: false,
        pendingEmail: email,
        emailForLogin: undefined,
      };
    }

    return {
      flow: "verify_otp",
      errorMessage: null,
      success: true,
      pendingEmail: email,
      emailForLogin: email,
    };
  }

  const parsedData = registerAccountSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsedData.success) {
    return {
      flow: "details",
      errorMessage:
        parsedData.error.issues[0]?.message ??
        "Please check the form and try again.",
      success: false,
      pendingEmail: undefined,
      emailForLogin: undefined,
    };
  }

  const result = await startSignupEmailVerification(parsedData.data);

  if (!result.ok) {
    if (result.error === "EMAIL_TAKEN") {
      return {
        flow: "details",
        errorMessage: "That email is already registered.",
        success: false,
        pendingEmail: undefined,
        emailForLogin: undefined,
      };
    }
    if (result.error === "EMAIL_SEND_FAILED") {
      return {
        flow: "details",
        errorMessage: signupEmailSendUserMessage(result.emailSendHint),
        success: false,
        pendingEmail: undefined,
        emailForLogin: undefined,
      };
    }
    if (result.error === "DATABASE") {
      return {
        flow: "details",
        errorMessage: signupDatabaseUserMessage(result.dbHint),
        success: false,
        pendingEmail: undefined,
        emailForLogin: undefined,
      };
    }
    return {
      flow: "details",
      errorMessage: "Something went wrong. Please try again.",
      success: false,
      pendingEmail: undefined,
      emailForLogin: undefined,
    };
  }

  return {
    flow: "verify_otp",
    errorMessage: null,
    success: false,
    pendingEmail: parsedData.data.email.toLowerCase(),
    emailForLogin: undefined,
  };
};
