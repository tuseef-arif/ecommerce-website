"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guards";
import {
  adminOrderCreateSchema,
  adminOrderUpdateSchema,
  parseOrderItemsJsonInput,
  type OrderItemInput,
} from "@/lib/orders/admin-schemas";
import { resolveCartVoucher } from "@/lib/discounts/resolve-cart-voucher";
import { prisma } from "@/lib/prisma";
import { finalProductPrice } from "@/lib/products/discount";
import {
  colorOptionsJsonToList,
  storageOptionsJsonToList,
  type ProductVariantOption,
} from "@/lib/products/specs";
import type {
  DeleteOrderResult,
  OrderFormFieldKey,
  OrderFormState,
} from "./form-state";

/* <SECURITY_REVIEW>
 * Vulnerability audit:
 * - Auth bypass: requireAdmin() runs server-side before every read/write.
 * - SQL injection: Prisma parameterises all queries; no raw SQL.
 * - IDOR: orderId / userId / productId are validated as bounded strings and
 *   looked up via Prisma's where:{id}; not-found responses surface as P2025.
 * - Stock integrity: order create runs inside `prisma.$transaction` and
 *   re-reads each product row to validate availability and snapshot the
 *   server-computed price/discount; client-supplied prices are ignored.
 * - Voucher: admin edit voucher codes are re-validated with `resolveCartVoucher`
 *   against server-built line totals (same rules as storefront); empty code
 *   clears the voucher on save.
 * - DoS: items are bounded at 100 line items per order; quantities at 1000.
 * - Status side effects: shippedAt/deliveredAt are derived from the chosen
 *   status server-side so the admin cannot back-date them through the URL.
 *
 * Mitigations:
 * - Zod validation at trust boundary; transactional create with stock check;
 *   strict re-shaping of Decimal fields with .toFixed(2) before persistence.
 *
 * Verification:
 * - A non-admin POSTing any of these actions is redirected to "/" before any
 *   row is mutated. Creating an order for an unknown product/user surfaces a
 *   field-level "no longer exists" error and the transaction is rolled back.
 *   Updating to DELIVERED automatically sets shippedAt + deliveredAt.
 *   CANCELLED clears shippedAt/deliveredAt like PENDING/CONFIRMED.
 * </SECURITY_REVIEW>
 */
const orderIdSchema = z
  .string()
  .min(1, "Order id is required.")
  .max(40, "Invalid order id.");

const fieldErrorsFromZod = (
  error: z.ZodError,
): Partial<Record<OrderFormFieldKey, string>> => {
  const fieldErrors: Partial<Record<OrderFormFieldKey, string>> = {};
  for (const issue of error.issues) {
    const top = issue.path[0];
    if (typeof top !== "string") continue;
    if (top === "userId") {
      if (!fieldErrors.userId) fieldErrors.userId = issue.message;
    } else if (top === "status") {
      if (!fieldErrors.status) fieldErrors.status = issue.message;
    } else if (top === "paymentMethod") {
      if (!fieldErrors.paymentMethod) fieldErrors.paymentMethod = issue.message;
    } else if (top === "itemsJson") {
      if (!fieldErrors.items) fieldErrors.items = issue.message;
    } else if (top === "voucherCode") {
      if (!fieldErrors.voucherCode) fieldErrors.voucherCode = issue.message;
    }
  }
  return fieldErrors;
};

const parseCreateInput = (formData: FormData) => ({
  userId: String(formData.get("userId") ?? ""),
  status: String(formData.get("status") ?? "PENDING"),
  paymentMethod: String(formData.get("paymentMethod") ?? "COD"),
  itemsJson: String(formData.get("itemsJson") ?? ""),
});

const parseUpdateInput = (formData: FormData) => ({
  status: String(formData.get("status") ?? ""),
  paymentMethod: String(formData.get("paymentMethod") ?? "COD"),
  itemsJson: String(formData.get("itemsJson") ?? ""),
  voucherCode: String(formData.get("voucherCode") ?? ""),
});

const round2 = (value: number): string => value.toFixed(2);

type ComputedLineItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  /** Discounted unit price BEFORE variant deltas. */
  discountedPrice: number;
  selectedColor: string | null;
  selectedStorage: string | null;
  colorPriceDelta: number;
  storagePriceDelta: number;
  /**
   * `(discountedPrice + colorPriceDelta + storagePriceDelta) × quantity`.
   * Variant deltas are not themselves discounted — they are an upcharge that
   * sits on top of the discounted base price.
   */
  lineTotal: number;
};

/**
 * Look up a chosen variant value within a product's option list and return
 * its `priceDelta`. Returns `null` when the value is supplied but not part
 * of the product's options (so the caller can surface a field-level error
 * instead of trusting client input). When `selected` is null and no options
 * are configured, the line is "no variant" and gets a delta of 0.
 *
 * The case-insensitive match mirrors how the storefront dropdown surfaces
 * option labels — admins editing a typo in the storefront shouldn't blow
 * up an in-flight order.
 */
const lookupVariantDelta = (
  selected: string | null,
  options: ReadonlyArray<ProductVariantOption>,
):
  | { ok: true; value: string | null; priceDelta: number }
  | { ok: false; reason: "missing" | "unknown" } => {
  const hasOptions = options.length > 0;

  if (!selected) {
    if (hasOptions) return { ok: false, reason: "missing" };
    return { ok: true, value: null, priceDelta: 0 };
  }

  if (!hasOptions) {
    // Admin removed the variant list after the row was set up; ignore the
    // stale selection and persist a "no variant" line.
    return { ok: true, value: null, priceDelta: 0 };
  }

  const normalised = selected.trim().toLowerCase();
  const match = options.find(
    (option) => option.value.trim().toLowerCase() === normalised,
  );
  if (!match) return { ok: false, reason: "unknown" };
  return { ok: true, value: match.value, priceDelta: match.priceDelta };
};

/** Transaction client type derived from `prisma.$transaction` so we don't
 * need to import an internal namespace from the generated Prisma client. */
type TransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];

const buildLineItems = async (
  tx: TransactionClient,
  items: ReadonlyArray<OrderItemInput>,
  stockAllowanceByProductId?: ReadonlyMap<string, number>,
): Promise<
  { ok: true; lines: ComputedLineItem[] } | { ok: false; message: string }
> => {
  const productIds = items.map((item) => item.productId);

  // Aggregate stock requirements per product so two lines of the same product
  // (different variants) are checked against the single shared stock pool.
  const stockNeeded = new Map<string, number>();
  for (const item of items) {
    stockNeeded.set(
      item.productId,
      (stockNeeded.get(item.productId) ?? 0) + item.quantity,
    );
  }

  const products = await tx.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      price: true,
      discountType: true,
      discountValue: true,
      isDiscountActive: true,
      stock: true,
      isActive: true,
      colorOptions: true,
      storageOptions: true,
    },
  });

  const byId = new Map(products.map((row) => [row.id, row]));

  const lines: ComputedLineItem[] = [];
  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) {
      return {
        ok: false,
        message: `Selected product no longer exists.`,
      };
    }
    if (!product.isActive) {
      return {
        ok: false,
        message: `Product "${product.name}" is no longer active.`,
      };
    }

    const totalNeeded = stockNeeded.get(product.id) ?? item.quantity;
    const stockAllowance = stockAllowanceByProductId?.get(product.id) ?? 0;
    const availableStock = product.stock + stockAllowance;
    if (availableStock < totalNeeded) {
      return {
        ok: false,
        message: `Not enough stock for "${product.name}" (have ${availableStock}, need ${totalNeeded}).`,
      };
    }

    const colorOptions = colorOptionsJsonToList(product.colorOptions);
    const storageOptions = storageOptionsJsonToList(product.storageOptions);

    const colorLookup = lookupVariantDelta(item.selectedColor, colorOptions);
    if (!colorLookup.ok) {
      const message =
        colorLookup.reason === "missing"
          ? `Pick a color for "${product.name}".`
          : `Selected color is no longer available for "${product.name}".`;
      return { ok: false, message };
    }
    const storageLookup = lookupVariantDelta(
      item.selectedStorage,
      storageOptions,
    );
    if (!storageLookup.ok) {
      const message =
        storageLookup.reason === "missing"
          ? `Pick a storage option for "${product.name}".`
          : `Selected storage is no longer available for "${product.name}".`;
      return { ok: false, message };
    }

    const unitPrice = Number(product.price);
    const final = finalProductPrice({
      price: unitPrice,
      discountType: product.discountType,
      discountValue:
        product.discountValue === null ? null : Number(product.discountValue),
      isDiscountActive: product.isDiscountActive,
    });
    const discountPercent =
      unitPrice > 0 ? Math.max(0, ((unitPrice - final) / unitPrice) * 100) : 0;

    const colorDelta = colorLookup.priceDelta;
    const storageDelta = storageLookup.priceDelta;
    const unitWithVariants = final + colorDelta + storageDelta;

    lines.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPrice,
      discountPercent,
      discountedPrice: final,
      selectedColor: colorLookup.value,
      selectedStorage: storageLookup.value,
      colorPriceDelta: colorDelta,
      storagePriceDelta: storageDelta,
      lineTotal: unitWithVariants * item.quantity,
    });
  }

  return { ok: true, lines };
};

type AdminOrderFinancialRecompute =
  | {
      ok: true;
      lines: ComputedLineItem[];
      subtotal: number;
      discountAmount: number;
      cartNetSubtotal: number;
      voucherCode: string | null;
      voucherName: string | null;
      voucherDiscountAmount: number;
      orderTotal: number;
    }
  | { ok: false; kind: "items"; message: string }
  | { ok: false; kind: "voucher"; message: string };

const recomputeAdminOrderUpdateFinancials = async (
  tx: TransactionClient,
  parsedItems: ReadonlyArray<OrderItemInput>,
  previousQtyByProductId: ReadonlyMap<string, number>,
  voucherRaw: string,
): Promise<AdminOrderFinancialRecompute> => {
  const built = await buildLineItems(tx, parsedItems, previousQtyByProductId);
  if (!built.ok) {
    return { ok: false, kind: "items", message: built.message };
  }

  const subtotal = built.lines.reduce(
    (sum, line) =>
      sum +
      (line.unitPrice + line.colorPriceDelta + line.storagePriceDelta) *
        line.quantity,
    0,
  );
  const discountAmount = built.lines.reduce(
    (sum, line) =>
      sum + (line.unitPrice - line.discountedPrice) * line.quantity,
    0,
  );
  const cartNetSubtotal = Math.round((subtotal - discountAmount) * 100) / 100;

  let voucherCode: string | null = null;
  let voucherName: string | null = null;
  let voucherDiscountAmount = 0;

  if (voucherRaw.length > 0) {
    const voucherResult = await resolveCartVoucher(
      tx,
      voucherRaw,
      cartNetSubtotal,
    );
    if (!voucherResult.ok) {
      return { ok: false, kind: "voucher", message: voucherResult.error };
    }
    voucherDiscountAmount = voucherResult.appliedAmount;
    voucherCode = voucherResult.code;
    voucherName = voucherResult.name;
  }

  const orderTotal =
    Math.round(
      (cartNetSubtotal - voucherDiscountAmount + Number.EPSILON) * 100,
    ) / 100;
  if (orderTotal < 0) {
    return {
      ok: false,
      kind: "voucher",
      message: "Order total became invalid after applying the voucher.",
    };
  }

  return {
    ok: true,
    lines: built.lines,
    subtotal,
    discountAmount,
    cartNetSubtotal,
    voucherCode,
    voucherName,
    voucherDiscountAmount,
    orderTotal,
  };
};

const previewAdminEditVoucherInputSchema = z.object({
  orderId: orderIdSchema,
  itemsJson: z
    .string()
    .max(50_000, "Order items payload is too large.")
    .min(1, "Add at least one product to the order."),
  voucherCode: z.string().max(40),
});

export type PreviewAdminEditVoucherResult =
  | { ok: true; code: string | null; appliedAmount: number; orderTotal: number }
  | { ok: false; error: string };

/**
 * Validates the current line items plus optional voucher without persisting.
 * Used from the order edit UI so admins can preview totals before save.
 */
export const previewAdminEditVoucherAction = async (input: {
  orderId: string;
  itemsJson: string;
  voucherCode: string;
}): Promise<PreviewAdminEditVoucherResult> => {
  await requireAdmin();

  const parsed = previewAdminEditVoucherInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid request.",
    };
  }

  let parsedItems: OrderItemInput[];
  try {
    parsedItems = parseOrderItemsJsonInput(parsed.data.itemsJson);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Invalid order items.",
    };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({
        where: { id: parsed.data.orderId },
        select: {
          items: { select: { productId: true, quantity: true } },
        },
      });
      if (!existing) {
        return { ok: false, error: "Order no longer exists." };
      }

      const previousQtyByProductId = new Map<string, number>();
      for (const item of existing.items) {
        previousQtyByProductId.set(
          item.productId,
          (previousQtyByProductId.get(item.productId) ?? 0) + item.quantity,
        );
      }

      const financials = await recomputeAdminOrderUpdateFinancials(
        tx,
        parsedItems,
        previousQtyByProductId,
        parsed.data.voucherCode.trim(),
      );
      if (!financials.ok) {
        return {
          ok: false,
          error:
            financials.kind === "items"
              ? financials.message
              : financials.message,
        };
      }

      return {
        ok: true,
        code: financials.voucherCode,
        appliedAmount: financials.voucherDiscountAmount,
        orderTotal: financials.orderTotal,
      };
    });
  } catch (error) {
    console.error("previewAdminEditVoucherAction failed", { error });
    return { ok: false, error: "Could not preview voucher. Please try again." };
  }
};

export const createOrderAction = async (
  _prevState: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> => {
  await requireAdmin();

  const input = parseCreateInput(formData);
  const parsed = adminOrderCreateSchema.safeParse(input);

  if (!parsed.success) {
    return {
      errorMessage: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  let parsedItems: OrderItemInput[];
  try {
    parsedItems = parseOrderItemsJsonInput(parsed.data.itemsJson);
  } catch (error) {
    return {
      errorMessage: null,
      fieldErrors: {
        items: error instanceof Error ? error.message : "Invalid order items.",
      },
    };
  }

  let createdOrderId: string;
  try {
    createdOrderId = await prisma.$transaction(async (tx) => {
      const customer = await tx.user.findUnique({
        where: { id: parsed.data.userId },
        select: { id: true },
      });
      if (!customer) {
        throw new ActionError({
          message: "Selected customer no longer exists.",
          fieldErrors: { userId: "Pick an existing customer." },
        });
      }

      const built = await buildLineItems(tx, parsedItems);
      if (!built.ok) {
        throw new ActionError({
          message: null,
          fieldErrors: { items: built.message },
        });
      }

      // Variant-aware sticker total. Deltas are NOT discounted, so adding
      // them into `subtotal` keeps the invariant
      // `subtotal − discountAmount − voucherDiscountAmount === totalAmount` for the order header.
      const subtotal = built.lines.reduce(
        (sum, line) =>
          sum +
          (line.unitPrice + line.colorPriceDelta + line.storagePriceDelta) *
            line.quantity,
        0,
      );
      const discountAmount = built.lines.reduce(
        (sum, line) =>
          sum + (line.unitPrice - line.discountedPrice) * line.quantity,
        0,
      );
      const totalAmount = built.lines.reduce(
        (sum, line) => sum + line.lineTotal,
        0,
      );

      const now = new Date();
      const status = parsed.data.status;
      const shippedAt =
        status === "SHIPPED" || status === "DELIVERED" ? now : null;
      const deliveredAt = status === "DELIVERED" ? now : null;

      const order = await tx.order.create({
        data: {
          userId: customer.id,
          status,
          paymentMethod: parsed.data.paymentMethod,
          subtotal: round2(subtotal),
          discountAmount: round2(discountAmount),
          totalAmount: round2(totalAmount),
          shippedAt,
          deliveredAt,
          items: {
            create: built.lines.map((line) => ({
              productId: line.productId,
              productName: line.productName,
              quantity: line.quantity,
              unitPrice: round2(line.unitPrice),
              discountPercent: round2(line.discountPercent),
              discountedPrice: round2(line.discountedPrice),
              selectedColor: line.selectedColor,
              selectedStorage: line.selectedStorage,
              colorPriceDelta: round2(line.colorPriceDelta),
              storagePriceDelta: round2(line.storagePriceDelta),
              lineTotal: round2(line.lineTotal),
            })),
          },
        },
        select: { id: true },
      });

      // Decrement stock atomically per product. Two variant lines of the same
      // product (e.g. White 8GB + Black 12GB) draw from the same stock pool,
      // so we sum the quantities first and decrement once to avoid
      // double-decrementing on multi-line variant orders.
      const stockPerProduct = new Map<string, number>();
      for (const line of built.lines) {
        stockPerProduct.set(
          line.productId,
          (stockPerProduct.get(line.productId) ?? 0) + line.quantity,
        );
      }
      for (const [productId, totalQuantity] of stockPerProduct) {
        await tx.product.update({
          where: { id: productId },
          data: { stock: { decrement: totalQuantity } },
        });
      }

      return order.id;
    });
  } catch (error) {
    if (error instanceof ActionError) {
      return { errorMessage: error.message, fieldErrors: error.fieldErrors };
    }
    const code = (error as { code?: string } | undefined)?.code;
    if (code === "P2003") {
      return {
        errorMessage: "Selected customer or product no longer exists.",
        fieldErrors: { userId: "Pick an existing customer." },
      };
    }
    console.error("createOrderAction failed", { error });
    return {
      errorMessage: "Could not create order. Please try again.",
      fieldErrors: {},
    };
  }

  revalidatePath("/dashboard/orders");
  redirect(`/dashboard/orders/${createdOrderId}/edit?status=created`);
};

export const updateOrderAction = async (
  _prevState: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> => {
  await requireAdmin();

  const idRaw = String(formData.get("orderId") ?? "");
  const idParsed = orderIdSchema.safeParse(idRaw);
  if (!idParsed.success) {
    return { errorMessage: "Invalid order id.", fieldErrors: {} };
  }

  const input = parseUpdateInput(formData);
  const parsed = adminOrderUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      errorMessage: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  let parsedItems: OrderItemInput[];
  try {
    parsedItems = parseOrderItemsJsonInput(parsed.data.itemsJson);
  } catch (error) {
    return {
      errorMessage: null,
      fieldErrors: {
        items: error instanceof Error ? error.message : "Invalid order items.",
      },
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({
        where: { id: idParsed.data },
        select: {
          status: true,
          shippedAt: true,
          deliveredAt: true,
          items: {
            select: {
              productId: true,
              quantity: true,
            },
          },
        },
      });
      if (!existing) {
        throw new ActionError({
          message: "Order no longer exists.",
          fieldErrors: {},
        });
      }

      const previousQtyByProductId = new Map<string, number>();
      for (const item of existing.items) {
        previousQtyByProductId.set(
          item.productId,
          (previousQtyByProductId.get(item.productId) ?? 0) + item.quantity,
        );
      }

      const financials = await recomputeAdminOrderUpdateFinancials(
        tx,
        parsedItems,
        previousQtyByProductId,
        parsed.data.voucherCode,
      );
      if (!financials.ok) {
        throw new ActionError({
          message: null,
          fieldErrors:
            financials.kind === "items"
              ? { items: financials.message }
              : { voucherCode: financials.message },
        });
      }

      const now = new Date();
      const status = parsed.data.status;

      let nextShippedAt: Date | null = existing.shippedAt;
      let nextDeliveredAt: Date | null = existing.deliveredAt;

      if (status === "PENDING") {
        nextShippedAt = null;
        nextDeliveredAt = null;
      } else if (status === "CONFIRMED") {
        nextShippedAt = null;
        nextDeliveredAt = null;
      } else if (status === "SHIPPED") {
        nextShippedAt = existing.shippedAt ?? now;
        nextDeliveredAt = null;
      } else if (status === "DELIVERED") {
        nextShippedAt = existing.shippedAt ?? now;
        nextDeliveredAt = existing.deliveredAt ?? now;
      } else if (status === "CANCELLED") {
        nextShippedAt = null;
        nextDeliveredAt = null;
      }

      await tx.order.update({
        where: { id: idParsed.data },
        data: {
          status,
          paymentMethod: parsed.data.paymentMethod,
          shippedAt: nextShippedAt,
          deliveredAt: nextDeliveredAt,
          subtotal: round2(financials.subtotal),
          discountAmount: round2(financials.discountAmount),
          voucherCode: financials.voucherCode,
          voucherName: financials.voucherName,
          voucherDiscountAmount: round2(financials.voucherDiscountAmount),
          totalAmount: round2(financials.orderTotal),
          items: {
            deleteMany: {},
            create: financials.lines.map((line) => ({
              productId: line.productId,
              productName: line.productName,
              quantity: line.quantity,
              unitPrice: round2(line.unitPrice),
              discountPercent: round2(line.discountPercent),
              discountedPrice: round2(line.discountedPrice),
              selectedColor: line.selectedColor,
              selectedStorage: line.selectedStorage,
              colorPriceDelta: round2(line.colorPriceDelta),
              storagePriceDelta: round2(line.storagePriceDelta),
              lineTotal: round2(line.lineTotal),
            })),
          },
        },
      });

      const nextQtyByProductId = new Map<string, number>();
      for (const line of financials.lines) {
        nextQtyByProductId.set(
          line.productId,
          (nextQtyByProductId.get(line.productId) ?? 0) + line.quantity,
        );
      }

      const allProductIds = new Set([
        ...previousQtyByProductId.keys(),
        ...nextQtyByProductId.keys(),
      ]);
      for (const productId of allProductIds) {
        const previousQty = previousQtyByProductId.get(productId) ?? 0;
        const nextQty = nextQtyByProductId.get(productId) ?? 0;
        const delta = nextQty - previousQty;
        if (delta > 0) {
          await tx.product.update({
            where: { id: productId },
            data: { stock: { decrement: delta } },
          });
        } else if (delta < 0) {
          await tx.product.update({
            where: { id: productId },
            data: { stock: { increment: Math.abs(delta) } },
          });
        }
      }
    });
  } catch (error) {
    if (error instanceof ActionError) {
      return { errorMessage: error.message, fieldErrors: error.fieldErrors };
    }
    const code = (error as { code?: string } | undefined)?.code;
    if (code === "P2025") {
      return { errorMessage: "Order no longer exists.", fieldErrors: {} };
    }
    console.error("updateOrderAction failed", {
      orderId: idParsed.data,
      error,
    });
    return {
      errorMessage: "Could not save order. Please try again.",
      fieldErrors: {},
    };
  }

  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${idParsed.data}`);
  revalidatePath(`/dashboard/orders/${idParsed.data}/edit`);
  redirect(`/dashboard/orders/${idParsed.data}`);
};

export const deleteOrderAction = async (
  orderId: string,
): Promise<DeleteOrderResult> => {
  await requireAdmin();

  const parsed = orderIdSchema.safeParse(orderId);
  if (!parsed.success) return { ok: false, error: "invalid_id" };

  try {
    await prisma.order.delete({ where: { id: parsed.data } });
  } catch (error) {
    const code = (error as { code?: string } | undefined)?.code;
    if (code === "P2025") return { ok: false, error: "not_found" };
    console.error("deleteOrderAction failed", {
      orderId: parsed.data,
      error,
    });
    return { ok: false, error: "unknown" };
  }

  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${parsed.data}`);
  revalidatePath(`/dashboard/orders/${parsed.data}/edit`);
  return { ok: true };
};

class ActionError extends Error {
  fieldErrors: Partial<Record<OrderFormFieldKey, string>>;
  constructor(input: {
    message: string | null;
    fieldErrors: Partial<Record<OrderFormFieldKey, string>>;
  }) {
    super(input.message ?? "");
    this.name = "ActionError";
    this.fieldErrors = input.fieldErrors;
    // Re-expose nullable message for callers (Error coerces null → "null").
    Object.defineProperty(this, "message", {
      value: input.message,
      writable: false,
      enumerable: true,
    });
  }
}
