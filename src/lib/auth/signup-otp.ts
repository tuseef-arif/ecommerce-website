import { createHash, randomInt } from "node:crypto";

export const SIGNUP_OTP_LENGTH = 6;

export const SIGNUP_OTP_TTL_MS = 15 * 60 * 1000;

export const SIGNUP_OTP_MAX_ATTEMPTS = 8;

export const hashSignupOtpCode = (raw: string): string =>
  createHash("sha256").update(raw, "utf8").digest("hex");

/** Cryptographic 6-digit numeric code (000000–999999). */
export const generateSignupOtpCode = (): string =>
  String(randomInt(0, 1_000_000)).padStart(SIGNUP_OTP_LENGTH, "0");
