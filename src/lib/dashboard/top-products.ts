import "server-only";

import { prisma } from "@/lib/prisma";

const TOP_LIMIT = 4;

export type AdminDashboardTopProduct = {
  productId: string;
  name: string;
  /** Second line under the title (brand / model). */
  subtitle: string;
  imagePath: string | null;
  /** Sum of line quantities across non-cancelled orders. */
  unitsOrdered: number;
};

/**
 * Products with the highest total units ordered (sum of `OrderItem.quantity`)
 * on orders that are not `CANCELLED`.
 */
export const getAdminDashboardTopProducts = async (
  limit: number = TOP_LIMIT,
): Promise<AdminDashboardTopProduct[]> => {
  const grouped = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      order: {
        status: { not: "CANCELLED" },
      },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  if (grouped.length === 0) return [];

  const productIds = grouped.map((row) => row.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      brand: true,
      model: true,
      productType: true,
      imagePath: true,
    },
  });

  const byId = new Map(products.map((p) => [p.id, p]));

  const result: AdminDashboardTopProduct[] = [];
  for (const row of grouped) {
    const product = byId.get(row.productId);
    const units = row._sum.quantity ?? 0;
    if (!product) {
      continue;
    }
    const subtitle = `${product.brand} / ${product.model}`;
    result.push({
      productId: product.id,
      name: product.name,
      subtitle,
      imagePath: product.imagePath,
      unitsOrdered: units,
    });
  }

  return result;
};
