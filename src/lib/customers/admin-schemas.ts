import { z } from "zod";

const trimmed = (max: number) =>
  z
    .string()
    .max(max)
    .transform((value) => value.trim());

const optionalTrimmed = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .default("")
    .transform((value) => value.trim());

const emailSchema = trimmed(254)
  .pipe(z.string().min(1, "Email is required."))
  .pipe(z.string().email("Please enter a valid email."))
  .transform((value) => value.toLowerCase());

const phoneSchema = optionalTrimmed(40).transform((value) => {
  if (value.length === 0) return null;
  return value;
});
const addressSchema = optionalTrimmed(200).transform((value) =>
  value.length === 0 ? null : value,
);
const citySchema = optionalTrimmed(80).transform((value) =>
  value.length === 0 ? null : value,
);
const countrySchema = optionalTrimmed(80).transform((value) =>
  value.length === 0 ? null : value,
);

const firstNameSchema = optionalTrimmed(80).transform((value) =>
  value.length === 0 ? null : value,
);
const lastNameSchema = optionalTrimmed(80).transform((value) =>
  value.length === 0 ? null : value,
);

const passwordCreateSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(200, "Password is too long.");

const passwordUpdateSchema = z
  .string()
  .max(200, "Password is too long.")
  .optional()
  .default("")
  .transform((value) => value)
  .pipe(
    z.string().refine((value) => value.length === 0 || value.length >= 8, {
      message: "New password must be at least 8 characters.",
    }),
  )
  .transform((value) => (value.length === 0 ? null : value));

const roleSchema = z.enum(["USER", "ADMIN"]).default("USER");
const statusSchema = z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE");

/**
 * Boundary schema for the create form. Inputs come from FormData as strings;
 * the schema coerces, trims, and bounds them so the action can pass clean
 * data straight to Prisma.
 */
export const adminCustomerCreateSchema = z.object({
  email: emailSchema,
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  phone: phoneSchema,
  address: addressSchema,
  city: citySchema,
  country: countrySchema,
  role: roleSchema,
  status: statusSchema,
  password: passwordCreateSchema,
});

export type AdminCustomerCreateValues = z.output<
  typeof adminCustomerCreateSchema
>;

/**
 * Boundary schema for the update form. Password is optional and only set when
 * the admin types a new value.
 */
export const adminCustomerUpdateSchema = z.object({
  email: emailSchema,
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  phone: phoneSchema,
  address: addressSchema,
  city: citySchema,
  country: countrySchema,
  role: roleSchema,
  status: statusSchema,
  password: passwordUpdateSchema,
});

export type AdminCustomerUpdateValues = z.output<
  typeof adminCustomerUpdateSchema
>;
