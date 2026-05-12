import "server-only";

import { formatCategoryLabel } from "@/lib/categories/format-category-label";
import { composeCustomerDisplayName } from "@/lib/customers/display";
import {
  storeCivilDayEndInstant,
  storeCivilDayStartInstant,
} from "@/lib/datetime/display-timezone";
import { ADMIN_ORDERS_PER_PAGE } from "@/lib/orders/filters";
import { prisma } from "@/lib/prisma";
import { finalProductPrice } from "@/lib/products/discount";
import {
  colorOptionsJsonToList,
  storageOptionsJsonToList,
} from "@/lib/products/specs";
import type {
  AdminOrderCustomerOption,
  AdminOrderDetail,
  AdminOrderListItem,
  AdminOrderListPage,
  AdminOrderProductOption,
  AdminOrdersListFilters,
} from "@/lib/orders/admin-types";

const buildOrderWhere = (filters: AdminOrdersListFilters) => {
  const where: Record<string, unknown> = {};

  const orFilters: Array<Record<string, unknown>> = [];
  if (filters.q.length > 0) {
    // Case-insensitive contains on user fields, plus exact short id prefix
    // match so admins can paste the order id directly.
    orFilters.push(
      { user: { email: { contains: filters.q, mode: "insensitive" } } },
      { user: { firstName: { contains: filters.q, mode: "insensitive" } } },
      { user: { lastName: { contains: filters.q, mode: "insensitive" } } },
      { id: { contains: filters.q, mode: "insensitive" } },
      { voucherCode: { contains: filters.q, mode: "insensitive" } },
      { voucherName: { contains: filters.q, mode: "insensitive" } },
    );
  }
  if (orFilters.length > 0) where.OR = orFilters;

  if (filters.status !== "all") where.status = filters.status;
  if (filters.paymentMethod !== "all") {
    where.paymentMethod = filters.paymentMethod;
  }

  const createdAt: Record<string, Date> = {};
  if (filters.from) {
    const from = storeCivilDayStartInstant(filters.from);
    if (!Number.isNaN(from.getTime())) createdAt.gte = from;
  }
  if (filters.to) {
    const to = storeCivilDayEndInstant(filters.to);
    if (!Number.isNaN(to.getTime())) createdAt.lte = to;
  }
  if (Object.keys(createdAt).length > 0) where.createdAt = createdAt;

  return where;
};

const shortenOrderId = (id: string): string => id.slice(-6).toUpperCase();

export const listAdminOrders = async (
  filters: AdminOrdersListFilters,
  perPage: number = ADMIN_ORDERS_PER_PAGE,
): Promise<AdminOrderListPage> => {
  const where = buildOrderWhere(filters);
  const skip = (filters.page - 1) * perPage;

  const [rows, totalCount] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
      select: {
        id: true,
        status: true,
        paymentMethod: true,
        subtotal: true,
        discountAmount: true,
        totalAmount: true,
        createdAt: true,
        updatedAt: true,
        shippedAt: true,
        deliveredAt: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        items: { select: { quantity: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  const items: AdminOrderListItem[] = rows.map((row) => ({
    id: row.id,
    shortId: shortenOrderId(row.id),
    status: row.status,
    paymentMethod: row.paymentMethod,
    itemsCount: row.items.length,
    itemsQuantity: row.items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: row.subtotal.toFixed(2),
    discountAmount: row.discountAmount.toFixed(2),
    totalAmount: row.totalAmount.toFixed(2),
    customer: {
      id: row.user.id,
      email: row.user.email,
      displayName: composeCustomerDisplayName({
        email: row.user.email,
        firstName: row.user.firstName,
        lastName: row.user.lastName,
      }),
    },
    createdAtIso: row.createdAt.toISOString(),
    updatedAtIso: row.updatedAt.toISOString(),
    shippedAtIso: row.shippedAt ? row.shippedAt.toISOString() : null,
    deliveredAtIso: row.deliveredAt ? row.deliveredAt.toISOString() : null,
  }));

  const pageCount = totalCount === 0 ? 1 : Math.ceil(totalCount / perPage);

  return {
    items,
    totalCount,
    page: filters.page,
    perPage,
    pageCount,
  };
};

export const getAdminOrderById = async (
  orderId: string,
): Promise<AdminOrderDetail | null> => {
  const row = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      paymentMethod: true,
      subtotal: true,
      discountAmount: true,
      voucherCode: true,
      voucherDiscountAmount: true,
      totalAmount: true,
      shippingAddress: true,
      shippingCity: true,
      shippingCountry: true,
      shippingPhone: true,
      createdAt: true,
      updatedAt: true,
      shippedAt: true,
      deliveredAt: true,
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      items: {
        select: {
          id: true,
          productId: true,
          productName: true,
          quantity: true,
          unitPrice: true,
          discountPercent: true,
          discountedPrice: true,
          selectedColor: true,
          selectedStorage: true,
          colorPriceDelta: true,
          storagePriceDelta: true,
          lineTotal: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!row) return null;

  return {
    id: row.id,
    shortId: shortenOrderId(row.id),
    status: row.status,
    paymentMethod: row.paymentMethod,
    subtotal: row.subtotal.toFixed(2),
    discountAmount: row.discountAmount.toFixed(2),
    voucherCode: row.voucherCode,
    voucherDiscountAmount: row.voucherDiscountAmount.toFixed(2),
    totalAmount: row.totalAmount.toFixed(2),
    shippingAddress: row.shippingAddress,
    shippingCity: row.shippingCity,
    shippingCountry: row.shippingCountry,
    shippingPhone: row.shippingPhone,
    customer: {
      id: row.user.id,
      email: row.user.email,
      displayName: composeCustomerDisplayName({
        email: row.user.email,
        firstName: row.user.firstName,
        lastName: row.user.lastName,
      }),
    },
    items: row.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toFixed(2),
      discountPercent: item.discountPercent.toFixed(2),
      discountedPrice: item.discountedPrice.toFixed(2),
      selectedColor: item.selectedColor,
      selectedStorage: item.selectedStorage,
      colorPriceDelta: item.colorPriceDelta.toFixed(2),
      storagePriceDelta: item.storagePriceDelta.toFixed(2),
      lineTotal: item.lineTotal.toFixed(2),
    })),
    createdAtIso: row.createdAt.toISOString(),
    updatedAtIso: row.updatedAt.toISOString(),
    shippedAtIso: row.shippedAt ? row.shippedAt.toISOString() : null,
    deliveredAtIso: row.deliveredAt ? row.deliveredAt.toISOString() : null,
  };
};

/**
 * Active products available for admin order creation. Returns up to `take`
 * products ordered by name; only `isActive: true` rows are surfaced.
 *
 * Includes the owning category + the admin-managed `colorOptions` and
 * `storageOptions` so the order editor can:
 *   1) narrow the product dropdown by category, and
 *   2) render variant dropdowns only when a product actually has them, with
 *      the correct `(+Rs N)` upcharge labels.
 *
 * Snapshot price/discount is computed here so the form can render it without
 * recomputing the discount math on the client.
 */
export const listAdminOrderProductOptions = async (
  take = 200,
): Promise<AdminOrderProductOption[]> => {
  const rows = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    take,
    select: {
      id: true,
      name: true,
      brand: true,
      price: true,
      discountType: true,
      discountValue: true,
      isDiscountActive: true,
      stock: true,
      isActive: true,
      colorOptions: true,
      storageOptions: true,
      category: { select: { id: true, slug: true, name: true } },
    },
  });

  return rows.map((row) => {
    const priceNumber = Number(row.price);
    const finalPrice = finalProductPrice({
      price: priceNumber,
      discountType: row.discountType,
      discountValue:
        row.discountValue === null ? null : Number(row.discountValue),
      isDiscountActive: row.isDiscountActive,
    });
    const discountPercent =
      priceNumber > 0
        ? Math.max(0, ((priceNumber - finalPrice) / priceNumber) * 100)
        : 0;

    return {
      id: row.id,
      name: row.name,
      brand: row.brand,
      finalPrice: finalPrice.toFixed(2),
      discountPercent: discountPercent.toFixed(2),
      discountedPrice: finalPrice.toFixed(2),
      unitPrice: priceNumber.toFixed(2),
      stock: row.stock,
      isActive: row.isActive,
      category: {
        id: row.category.id,
        slug: row.category.slug,
        name: formatCategoryLabel(row.category.slug || row.category.name),
      },
      colorOptions: colorOptionsJsonToList(row.colorOptions),
      storageOptions: storageOptionsJsonToList(row.storageOptions),
    } satisfies AdminOrderProductOption;
  });
};

export const listAdminOrderCustomerOptions = async (
  take = 200,
): Promise<AdminOrderCustomerOption[]> => {
  const rows = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    displayName: composeCustomerDisplayName({
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
    }),
  }));
};
