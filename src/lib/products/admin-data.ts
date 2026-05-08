import "server-only";

import { formatCategoryLabel } from "@/lib/categories/format-category-label";
import { prisma } from "@/lib/prisma";
import { finalProductPrice } from "@/lib/products/discount";
import { ADMIN_PRODUCTS_PER_PAGE } from "@/lib/products/filters";
import {
  colorOptionsJsonToList,
  specsJsonToEntries,
  storageOptionsJsonToList,
} from "@/lib/products/specs";
import type {
  AdminProductCategoryOption,
  AdminProductDetail,
  AdminProductListItem,
  AdminProductListPage,
  AdminProductsListFilters,
} from "@/lib/products/admin-types";

/**
 * Catalog ordering for admin dropdowns; the array order also drives the
 * sort below so we don't need a parallel "slug order" list. Add new entries
 * here to surface them in admin filters and the product form.
 */
const ADMIN_CATEGORY_CATALOG: ReadonlyArray<{ slug: string; name: string }> = [
  { slug: "mobiles", name: "Mobiles" },
  { slug: "earbuds", name: "Earbuds" },
  { slug: "smart-watches", name: "Smart Watches" },
  { slug: "power-banks", name: "Power Banks" },
  { slug: "data-cables", name: "Data Cables" },
  { slug: "chargers", name: "Chargers" },
  { slug: "speakers", name: "Speakers" },
  { slug: "tablets", name: "Tablets" },
  { slug: "headphones", name: "Headphones" },
  { slug: "car-accessories", name: "Car Accessories" },
] as const;

const buildProductWhere = (filters: AdminProductsListFilters) => {
  const where: Record<string, unknown> = {};

  if (filters.q.length > 0) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { brand: { contains: filters.q, mode: "insensitive" } },
      { model: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.brand.length > 0) {
    where.brand = { equals: filters.brand, mode: "insensitive" };
  }
  if (filters.category.length > 0) {
    where.category = {
      slug: { equals: filters.category, mode: "insensitive" },
    };
  }
  if (filters.status === "active") where.isActive = true;
  if (filters.status === "inactive") where.isActive = false;

  return where;
};

export const listAdminProducts = async (
  filters: AdminProductsListFilters,
  perPage: number = ADMIN_PRODUCTS_PER_PAGE,
): Promise<AdminProductListPage> => {
  const where = buildProductWhere(filters);
  const skip = (filters.page - 1) * perPage;

  const [rows, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: perPage,
      select: {
        id: true,
        name: true,
        slug: true,
        brand: true,
        imagePath: true,
        price: true,
        discountType: true,
        discountValue: true,
        isDiscountActive: true,
        stock: true,
        isActive: true,
        updatedAt: true,
        category: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const items: AdminProductListItem[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    brand: row.brand,
    imagePath: row.imagePath,
    price: row.price.toFixed(2),
    finalPrice: finalProductPrice({
      price: Number(row.price),
      discountType: row.discountType,
      discountValue:
        row.discountValue === null ? null : Number(row.discountValue),
      isDiscountActive: row.isDiscountActive,
    }).toFixed(2),
    discountType: row.discountType,
    discountValue:
      row.discountValue === null ? null : row.discountValue.toFixed(2),
    isDiscountActive: row.isDiscountActive,
    stock: row.stock,
    isActive: row.isActive,
    category: {
      ...row.category,
      // Frontend display: title-case the slug-style backend value.
      name: formatCategoryLabel(row.category.slug || row.category.name),
    },
    updatedAtIso: row.updatedAt.toISOString(),
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

export const listAdminProductCategories = async (): Promise<
  AdminProductCategoryOption[]
> => {
  // Avoid transaction-start failures on constrained/pooled DB connections:
  // 1) ensure rows exist (idempotent), 2) sync display names best-effort.
  await prisma.category.createMany({
    data: ADMIN_CATEGORY_CATALOG.map((category) => ({
      slug: category.slug,
      name: category.name,
    })),
    skipDuplicates: true,
  });

  await Promise.all(
    ADMIN_CATEGORY_CATALOG.map((category) =>
      prisma.category.updateMany({
        where: { slug: category.slug },
        data: { name: category.name },
      }),
    ),
  );

  const rows = await prisma.category.findMany({
    where: {
      slug: { in: ADMIN_CATEGORY_CATALOG.map((category) => category.slug) },
    },
    select: { id: true, name: true, slug: true },
  });

  const bySlug = new Map(rows.map((row) => [row.slug, row]));

  return ADMIN_CATEGORY_CATALOG.flatMap((category) => {
    const row = bySlug.get(category.slug);
    if (!row) return [];
    return [
      {
        id: row.id,
        slug: row.slug,
        name: formatCategoryLabel(row.slug || row.name),
      } satisfies AdminProductCategoryOption,
    ];
  });
};

export const listAdminProductDistinctBrands = async (
  categorySlug?: string,
): Promise<string[]> => {
  const normalizedCategorySlug = (categorySlug ?? "").trim().toLowerCase();
  const rows = await prisma.product.findMany({
    where:
      normalizedCategorySlug.length > 0
        ? {
            category: {
              slug: { equals: normalizedCategorySlug, mode: "insensitive" },
            },
          }
        : undefined,
    distinct: ["brand"],
    orderBy: { brand: "asc" },
    select: { brand: true },
  });
  return rows.map((row) => row.brand).filter((brand) => brand.length > 0);
};

export const getAdminProductById = async (
  productId: string,
): Promise<AdminProductDetail | null> => {
  const row = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      slug: true,
      brand: true,
      model: true,
      description: true,
      imagePath: true,
      price: true,
      discountType: true,
      discountValue: true,
      isDiscountActive: true,
      stock: true,
      isActive: true,
      categoryId: true,
      specs: true,
      colorOptions: true,
      storageOptions: true,
    },
  });
  if (!row) return null;
  let isOnSale = false;
  let isNewArrival = false;
  try {
    const productFlags = await prisma.$queryRaw<
      Array<{ isOnSale: boolean; isNewArrival: boolean }>
    >`
      SELECT "isOnSale", "isNewArrival"
      FROM "Product"
      WHERE "id" = ${productId}
      LIMIT 1
    `;
    isOnSale = productFlags[0]?.isOnSale ?? false;
    isNewArrival = productFlags[0]?.isNewArrival ?? false;
  } catch {
    isOnSale = false;
    isNewArrival = false;
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    brand: row.brand,
    model: row.model,
    description: row.description,
    imagePath: row.imagePath,
    price: row.price.toFixed(2),
    discountType: row.discountType,
    discountValue:
      row.discountValue === null ? null : row.discountValue.toFixed(2),
    isDiscountActive: row.isDiscountActive,
    stock: row.stock,
    isActive: row.isActive,
    isOnSale,
    isNewArrival,
    categoryId: row.categoryId,
    specs: specsJsonToEntries(row.specs),
    colorOptions: colorOptionsJsonToList(row.colorOptions),
    storageOptions: storageOptionsJsonToList(row.storageOptions),
  };
};
