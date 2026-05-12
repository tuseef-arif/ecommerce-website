/**
 * Shared payment-method vocabulary.
 *
 * Storefront forms use lowercase tokens (`bank_transfer | self_collection |
 * cod`) for state ergonomics; the database (and admin module) uses the
 * `PaymentMethod` Prisma enum. Helpers here keep the two in lock-step and
 * provide ready-made option lists for radios + select fields.
 */

import { PaymentMethod } from "@/generated/prisma/enums";

/** Lowercase storefront token used in checkout state. */
export const CHECKOUT_PAYMENT_METHODS = [
  "bank_transfer",
  "self_collection",
  "cod",
] as const;

export type CheckoutPaymentMethod = (typeof CHECKOUT_PAYMENT_METHODS)[number];

const STOREFRONT_TO_DB: Record<CheckoutPaymentMethod, PaymentMethod> = {
  bank_transfer: PaymentMethod.BANK_TRANSFER,
  self_collection: PaymentMethod.SELF_COLLECTION,
  cod: PaymentMethod.COD,
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: "Direct bank transfer",
  SELF_COLLECTION: "Self Collection",
  COD: "Cash on delivery",
};

export const BANK_TRANSFER_ACCOUNT_DETAILS = {
  accountTitle: "FIVE STAR MOBILE",
  iban: "PK50UNIL0109000319082553",
} as const;

export const BANK_TRANSFER_ACCOUNT_DISPLAY = `${BANK_TRANSFER_ACCOUNT_DETAILS.accountTitle} ${BANK_TRANSFER_ACCOUNT_DETAILS.iban}`;

const BANK_TRANSFER_DESCRIPTION_LEADING =
  "Transfer payment to our bank account ";
const BANK_TRANSFER_DESCRIPTION_TRAILING =
  ". Order ships after payment confirmation.";

const PAYMENT_METHOD_DESCRIPTIONS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: `${BANK_TRANSFER_DESCRIPTION_LEADING}${BANK_TRANSFER_ACCOUNT_DISPLAY}${BANK_TRANSFER_DESCRIPTION_TRAILING}`,
  SELF_COLLECTION: "You can collect from store and pay at pickup.",
  COD: "Pay with cash upon delivery.",
};

export const checkoutToDbPaymentMethod = (
  value: CheckoutPaymentMethod,
): PaymentMethod => STOREFRONT_TO_DB[value];

export const paymentMethodLabel = (value: PaymentMethod): string =>
  PAYMENT_METHOD_LABELS[value];

export const paymentMethodDescription = (value: PaymentMethod): string =>
  PAYMENT_METHOD_DESCRIPTIONS[value];

export type PaymentMethodDescriptionSegments =
  | {
      kind: "bank_transfer";
      leadingText: string;
      emphasizedText: string;
      trailingText: string;
    }
  | { kind: "plain"; text: string };

export const paymentMethodDescriptionSegments = (
  value: PaymentMethod,
): PaymentMethodDescriptionSegments => {
  if (value === PaymentMethod.BANK_TRANSFER) {
    return {
      kind: "bank_transfer",
      leadingText: BANK_TRANSFER_DESCRIPTION_LEADING,
      emphasizedText: BANK_TRANSFER_ACCOUNT_DISPLAY,
      trailingText: BANK_TRANSFER_DESCRIPTION_TRAILING,
    };
  }

  return { kind: "plain", text: PAYMENT_METHOD_DESCRIPTIONS[value] };
};

/** Storefront radio options (token + label) in the order shoppers see them. */
export const CHECKOUT_PAYMENT_OPTIONS: ReadonlyArray<{
  value: CheckoutPaymentMethod;
  label: string;
}> = CHECKOUT_PAYMENT_METHODS.map((value) => ({
  value,
  label: PAYMENT_METHOD_LABELS[STOREFRONT_TO_DB[value]],
}));

/** Admin select-field options keyed by the DB enum (COD listed first as default). */
const ADMIN_PAYMENT_METHOD_ORDER: ReadonlyArray<PaymentMethod> = [
  PaymentMethod.COD,
  PaymentMethod.BANK_TRANSFER,
  PaymentMethod.SELF_COLLECTION,
];

export const PAYMENT_METHOD_OPTIONS: ReadonlyArray<{
  value: PaymentMethod;
  label: string;
}> = ADMIN_PAYMENT_METHOD_ORDER.map((value) => ({
  value,
  label: PAYMENT_METHOD_LABELS[value],
}));
