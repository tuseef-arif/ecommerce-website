import { z } from "zod";

/** Billing block for checkout — shared by `placeCheckoutOrderAction` and the client form. */
export const checkoutBillingFieldsSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required.")
    .max(80, "First name is too long."),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required.")
    .max(80, "Last name is too long."),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required.")
    .max(40, "Phone number is too long."),
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Please enter a valid email.")
    .max(254, "Email is too long."),
  address: z
    .string()
    .trim()
    .min(1, "Address is required.")
    .max(200, "Address is too long."),
  city: z
    .string()
    .trim()
    .min(1, "City is required.")
    .max(80, "City is too long."),
  country: z
    .string()
    .trim()
    .min(1, "Country is required.")
    .max(80, "Country is too long."),
});

export type CheckoutBillingFields = z.infer<typeof checkoutBillingFieldsSchema>;
