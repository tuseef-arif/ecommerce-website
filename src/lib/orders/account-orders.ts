import type { OrderStatus, PaymentMethod } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export const formatStoreOrderNumber = (orderId: string): string =>
  orderId.slice(-8).toUpperCase();

export type AccountOrderListItem = {
  id: string;
  createdAt: Date;
  status: OrderStatus;
  totalAmount: { toString(): string };
  itemCount: number;
  previewImagePath: string | null;
};

/**
 * Orders for the signed-in customer, newest first.
 * <SECURITY_REVIEW>
 * - Exposure: results are filtered by `userId` only; never pass another user’s id.
 * - SQL injection: Prisma parameterized queries only.
 * </SECURITY_REVIEW>
 */
export const listAccountOrdersForUser = async (
  userId: string,
): Promise<AccountOrderListItem[]> => {
  const rows = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      status: true,
      totalAmount: true,
      _count: { select: { items: true } },
      items: {
        take: 1,
        orderBy: { createdAt: "asc" },
        select: {
          product: { select: { imagePath: true } },
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt,
    status: row.status,
    totalAmount: row.totalAmount,
    itemCount: row._count.items,
    previewImagePath: row.items[0]?.product.imagePath ?? null,
  }));
};

export type AccountOrderDetailItem = {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: { toString(): string };
  discountedPrice: { toString(): string };
  discountPercent: { toString(): string };
  colorPriceDelta: { toString(): string };
  storagePriceDelta: { toString(): string };
  selectedColor: string | null;
  selectedStorage: string | null;
  lineTotal: { toString(): string };
  product: {
    slug: string;
    imagePath: string | null;
    isActive: boolean;
  };
};

export type AccountOrderDetail = {
  id: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  createdAt: Date;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  subtotal: { toString(): string };
  discountAmount: { toString(): string };
  voucherCode: string | null;
  voucherDiscountAmount: { toString(): string };
  totalAmount: { toString(): string };
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
  };
  items: AccountOrderDetailItem[];
};

/**
 * Single order scoped to the owner. Returns null if id invalid or not owned.
 * <SECURITY_REVIEW>
 * - Auth bypass: `findFirst` requires matching `userId`; do not query by id alone.
 * </SECURITY_REVIEW>
 */
export const getAccountOrderForUser = async (
  userId: string,
  orderId: string,
): Promise<AccountOrderDetail | null> => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    select: {
      id: true,
      status: true,
      paymentMethod: true,
      createdAt: true,
      shippedAt: true,
      deliveredAt: true,
      subtotal: true,
      discountAmount: true,
      voucherCode: true,
      voucherDiscountAmount: true,
      totalAmount: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          country: true,
        },
      },
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          productName: true,
          quantity: true,
          unitPrice: true,
          discountedPrice: true,
          discountPercent: true,
          colorPriceDelta: true,
          storagePriceDelta: true,
          selectedColor: true,
          selectedStorage: true,
          lineTotal: true,
          product: {
            select: { slug: true, imagePath: true, isActive: true },
          },
        },
      },
    },
  });

  if (!order) return null;

  return {
    ...order,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountedPrice: item.discountedPrice,
      discountPercent: item.discountPercent,
      colorPriceDelta: item.colorPriceDelta,
      storagePriceDelta: item.storagePriceDelta,
      selectedColor: item.selectedColor,
      selectedStorage: item.selectedStorage,
      lineTotal: item.lineTotal,
      product: item.product,
    })),
  };
};
