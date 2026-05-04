import { z } from "zod";

/** Bcrypt practical limit. */
const PASSWORD_MAX_LENGTH = 72;

const passwordRulesMessage =
  "Password must be at least 8 characters and include at least one capital letter and one number.";

/**
 * Sign-up / account-creation password rules (8+ chars, ≥1 uppercase, ≥1 digit).
 */
export const signupPasswordSchema = z
  .string()
  .min(8, passwordRulesMessage)
  .max(PASSWORD_MAX_LENGTH, "Password is too long.")
  .regex(/[A-Z]/, "Password must contain at least one capital letter.")
  .regex(/[0-9]/, "Password must contain at least one number.");

/** For `pattern` on password inputs (browser hint; server still validates with Zod). */
export const SIGNUP_PASSWORD_PATTERN = "^(?=.*[A-Z])(?=.*[0-9]).{8,}$";

export const SIGNUP_PASSWORD_FIELD_TITLE = passwordRulesMessage;
