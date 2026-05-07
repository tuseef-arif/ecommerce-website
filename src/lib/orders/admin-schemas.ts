import { z } from "zod";

const trimmed = (max: number) =>
  z
    .string()
    .max(max)
    .transform((value) => value.trim());

const orderStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
]);

export const adminOrderCreateSchema = z.object({
  userId: trimmed(40).pipe(z.string().min(1, "Customer is required.")),
  status: orderStatusSchema.default("PENDING"),
  itemsJson: z
    .string()
    .max(50_000, "Order items payload is too large.")
    .min(1, "Add at least one product to the order."),
});

export type AdminOrderCreateValues = z.output<typeof adminOrderCreateSchema>;

export const adminOrderUpdateSchema = z.object({
  status: orderStatusSchema,
  itemsJson: z
    .string()
    .max(50_000, "Order items payload is too large.")
    .min(1, "Add at least one product to the order."),
});

export type AdminOrderUpdateValues = z.output<typeof adminOrderUpdateSchema>;

/** Matches the variant `value` length cap in `parseVariantListJsonInput`. */
const ORDER_ITEM_VARIANT_MAX_LEN = 64;

const optionalVariant = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;
    if (trimmed.length > ORDER_ITEM_VARIANT_MAX_LEN) {
      throw new Error(
        `Variant value is too long (max ${ORDER_ITEM_VARIANT_MAX_LEN} characters).`,
      );
    }
    return trimmed;
  });

export const orderItemInputSchema = z.object({
  productId: trimmed(40).pipe(z.string().min(1)),
  quantity: z.number().int().min(1).max(1000),
  /** Chosen color variant (e.g. "White"); null when the product has none. */
  selectedColor: optionalVariant,
  /** Chosen storage variant (e.g. "12 GB"); null when the product has none. */
  selectedStorage: optionalVariant,
});

export type OrderItemInput = z.output<typeof orderItemInputSchema>;

const ITEMS_MAX_COUNT = 100;

/**
 * Build the dedup key for an order line. Same product picked with two
 * different variants is two distinct lines (different SKUs from the
 * shopper's perspective), so the key must include the chosen variants.
 */
const lineDedupKey = (input: OrderItemInput): string =>
  `${input.productId}|${input.selectedColor ?? ""}|${input.selectedStorage ?? ""}`;

/**
 * Parses the JSON payload from the order items editor. Drops empty rows,
 * deduplicates by `(productId, selectedColor, selectedStorage)` (summing
 * quantities so the admin doesn't get two identical lines if they pick the
 * same product+variant twice), and bounds count + values. Throws on invalid
 * payloads with a user-facing error message.
 */
export const parseOrderItemsJsonInput = (raw: string): OrderItemInput[] => {
  if (!raw || raw.trim().length === 0) {
    throw new Error("Add at least one product to the order.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Order items payload is invalid.");
  }
  if (!Array.isArray(parsed)) {
    throw new Error("Order items payload is invalid.");
  }

  if (parsed.length === 0) {
    throw new Error("Add at least one product to the order.");
  }
  if (parsed.length > ITEMS_MAX_COUNT) {
    throw new Error(
      `Order items can include at most ${ITEMS_MAX_COUNT} products.`,
    );
  }

  const merged = new Map<string, OrderItemInput>();
  for (const entry of parsed) {
    const validated = orderItemInputSchema.safeParse(entry);
    if (!validated.success) {
      throw new Error(
        validated.error.issues[0]?.message ?? "Invalid order item.",
      );
    }
    const item = validated.data;
    const key = lineDedupKey(item);
    const existing = merged.get(key);
    if (existing) {
      // Bound the merged quantity so a malicious caller can't bypass the
      // per-row max by spamming dupes.
      const nextQuantity = Math.min(1000, existing.quantity + item.quantity);
      merged.set(key, { ...existing, quantity: nextQuantity });
    } else {
      merged.set(key, item);
    }
  }

  return Array.from(merged.values());
};
