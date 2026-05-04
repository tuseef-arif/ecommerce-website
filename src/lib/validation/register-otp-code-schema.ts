import { z } from "zod";
import { SIGNUP_OTP_LENGTH } from "@/lib/auth/signup-otp";

export const registerOtpCodeSchema = z
  .string()
  .trim()
  .length(
    SIGNUP_OTP_LENGTH,
    `Enter the ${SIGNUP_OTP_LENGTH}-digit code from your email.`,
  )
  .regex(/^\d+$/, "Use digits only.");

export type RegisterOtpCodeInput = z.infer<typeof registerOtpCodeSchema>;
