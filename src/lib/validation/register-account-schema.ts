import { z } from "zod";
import { signupPasswordSchema } from "@/lib/validation/signup-password-schema";

/** Single given/family name — typical form cap; blocks oversized input. */
const NAME_FIELD_MAX_LENGTH = 50;
/** Entire address length per RFC 5321 / common SMTP limits. */
const EMAIL_MAX_LENGTH = 254;
const ADDRESS_MAX_LENGTH = 200;
const CITY_MAX_LENGTH = 80;
const COUNTRY_MAX_LENGTH = 80;

const digitsOnlyPhone = (raw: string) => raw.trim().replace(/\D/g, "");

export const registerAccountSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, "First name is required.")
      .max(NAME_FIELD_MAX_LENGTH, "First name is too long."),
    lastName: z
      .string()
      .trim()
      .min(1, "Last name is required.")
      .max(NAME_FIELD_MAX_LENGTH, "Last name is too long."),
    email: z
      .string()
      .trim()
      .min(1, "Email is required.")
      .max(EMAIL_MAX_LENGTH, "Email address is too long.")
      .email("Please enter a valid email."),
    phone: z
      .string()
      .trim()
      .min(1, "Phone number is required.")
      .transform(digitsOnlyPhone)
      .pipe(
        z
          .string()
          .min(10, "Enter a valid phone number (at least 10 digits).")
          .max(15, "Phone number is too long."),
      ),
    address: z
      .string()
      .trim()
      .min(1, "Address is required.")
      .max(ADDRESS_MAX_LENGTH, "Address is too long."),
    city: z
      .string()
      .trim()
      .min(1, "City is required.")
      .max(CITY_MAX_LENGTH, "City is too long."),
    country: z
      .string()
      .trim()
      .min(1, "Country is required.")
      .max(COUNTRY_MAX_LENGTH, "Country is too long."),
    password: signupPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type RegisterAccountInput = z.infer<typeof registerAccountSchema>;
