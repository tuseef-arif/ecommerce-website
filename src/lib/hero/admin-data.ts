import "server-only";

import { prisma } from "@/lib/prisma";
import { specsJsonToList } from "@/lib/hero/specs";
import type {
  AdminHeroLinkedProduct,
  AdminHeroSlideDetail,
  AdminHeroSlideListItem,
} from "@/lib/hero/admin-types";

/** Cap on rows returned by the picker's typeahead search. */
export const HERO_PRODUCT_SEARCH_LIMIT = 10;

export const listAdminHeroSlides = async (): Promise<
  AdminHeroSlideListItem[]
> => {
  const rows = await prisma.heroSlide.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      imagePath: true,
      imageAlt: true,
      specs: true,
      sortOrder: true,
      isActive: true,
      updatedAt: true,
      _count: { select: { products: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    imagePath: row.imagePath,
    imageAlt: row.imageAlt,
    specs: specsJsonToList(row.specs),
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    linkedProductCount: row._count.products,
    updatedAtIso: row.updatedAt.toISOString(),
  }));
};

export const getAdminHeroSlideById = async (
  id: string,
): Promise<AdminHeroSlideDetail | null> => {
  const row = await prisma.heroSlide.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      imagePath: true,
      imageAlt: true,
      specs: true,
      sortOrder: true,
      isActive: true,
      products: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: {
          product: {
            select: {
              id: true,
              name: true,
              brand: true,
              slug: true,
              imagePath: true,
            },
          },
        },
      },
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    imagePath: row.imagePath,
    imageAlt: row.imageAlt,
    specs: specsJsonToList(row.specs),
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    linkedProducts: row.products.map((link) => link.product),
  };
};

/**
 * Typeahead-style search for the linked-products picker. Matches by product
 * name or brand (case-insensitive), filters to active products only, and caps
 * the result list so a typo never returns the whole catalog.
 */
export const searchAdminProductsForLink = async (
  rawQuery: string,
  options: { excludeIds?: ReadonlyArray<string> } = {},
): Promise<AdminHeroLinkedProduct[]> => {
  const query = rawQuery.trim();
  if (query.length < 2) return [];

  const excludeIds = Array.from(new Set(options.excludeIds ?? [])).filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );

  const rows = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { brand: { contains: query, mode: "insensitive" } },
        { model: { contains: query, mode: "insensitive" } },
      ],
      ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
    },
    orderBy: [{ name: "asc" }],
    take: HERO_PRODUCT_SEARCH_LIMIT,
    select: {
      id: true,
      name: true,
      brand: true,
      slug: true,
      imagePath: true,
    },
  });

  return rows;
};

/**
 * Returns the subset of supplied product ids that exist on `Product`.
 * Used by the create/update actions to fail fast when the form references
 * deleted rows instead of relying on a foreign-key error mid-write.
 */
export const filterExistingProductIds = async (
  ids: ReadonlyArray<string>,
): Promise<string[]> => {
  if (ids.length === 0) return [];
  const rows = await prisma.product.findMany({
    where: { id: { in: Array.from(new Set(ids)) } },
    select: { id: true },
  });
  const found = new Set(rows.map((row) => row.id));
  // Preserve the caller's original order; drop unknown ids silently so we
  // never resurrect a deleted product.
  const out: string[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    if (!found.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
};
