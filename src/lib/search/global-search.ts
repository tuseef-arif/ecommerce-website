import "server-only";

import { z } from "zod";
import { prisma } from "@/lib/prisma";

const DEFAULT_LIMIT_PER_GROUP = 6;
const MAX_LIMIT_PER_GROUP = 20;

const globalSearchInputSchema = z.object({
  query: z.string().trim().min(1).max(80),
  limitPerGroup: z
    .number()
    .int()
    .min(1)
    .max(MAX_LIMIT_PER_GROUP)
    .default(DEFAULT_LIMIT_PER_GROUP),
});

export type GlobalSearchProductResult = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  model: string;
  imagePath: string | null;
};

export type GlobalSearchCategoryResult = {
  id: string;
  name: string;
  slug: string;
};

export type GlobalSearchValueResult = {
  value: string;
};

export type GlobalSearchResult = {
  query: string;
  groups: {
    products: GlobalSearchProductResult[];
    brands: GlobalSearchValueResult[];
    categories: GlobalSearchCategoryResult[];
    models: GlobalSearchValueResult[];
  };
  totals: {
    products: number;
    brands: number;
    categories: number;
    models: number;
    overall: number;
  };
};

/**
 * Reusable global search across catalog entities by "name-like" fields.
 * - Products: Product.name
 * - Brands: Product.brand (distinct)
 * - Categories: Category.name
 * - Models: Product.model (distinct)
 */
export const globalSearch = async (input: {
  query: string;
  limitPerGroup?: number;
}): Promise<GlobalSearchResult> => {
  const parsed = globalSearchInputSchema.safeParse({
    query: input.query,
    limitPerGroup: input.limitPerGroup,
  });

  if (!parsed.success) {
    return {
      query: "",
      groups: { products: [], brands: [], categories: [], models: [] },
      totals: { products: 0, brands: 0, categories: 0, models: 0, overall: 0 },
    };
  }

  const { query, limitPerGroup } = parsed.data;
  const textContains = { contains: query, mode: "insensitive" as const };

  const [products, brandsRaw, categories, modelsRaw] =
    await prisma.$transaction([
      prisma.product.findMany({
        where: { name: textContains, isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          brand: true,
          model: true,
          imagePath: true,
        },
        orderBy: [{ name: "asc" }],
        take: limitPerGroup,
      }),
      prisma.product.findMany({
        where: { brand: textContains, isActive: true },
        select: { brand: true },
        distinct: ["brand"],
        orderBy: [{ brand: "asc" }],
        take: limitPerGroup,
      }),
      prisma.category.findMany({
        where: { name: textContains },
        select: { id: true, name: true, slug: true },
        orderBy: [{ name: "asc" }],
        take: limitPerGroup,
      }),
      prisma.product.findMany({
        where: { model: textContains, isActive: true },
        select: { model: true },
        distinct: ["model"],
        orderBy: [{ model: "asc" }],
        take: limitPerGroup,
      }),
    ]);

  const brands = brandsRaw.map((item) => ({ value: item.brand }));
  const models = modelsRaw.map((item) => ({ value: item.model }));

  const totals = {
    products: products.length,
    brands: brands.length,
    categories: categories.length,
    models: models.length,
    overall:
      products.length + brands.length + categories.length + models.length,
  };

  return {
    query,
    groups: { products, brands, categories, models },
    totals,
  };
};
