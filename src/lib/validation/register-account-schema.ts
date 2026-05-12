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

/** Optional on sign-up forms; checkout still sends billing address fields. */
const registerLocationField = (max: number, label: string) =>
  z
    .union([z.string(), z.undefined(), z.null()])
    .transform((v) => String(v ?? "").trim())
    .pipe(z.string().max(max, `${label} is too long.`));

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
    address: registerLocationField(ADDRESS_MAX_LENGTH, "Address"),
    city: registerLocationField(CITY_MAX_LENGTH, "City"),
    country: registerLocationField(COUNTRY_MAX_LENGTH, "Country"),
    password: signupPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type RegisterAccountInput = z.infer<typeof registerAccountSchema>;
