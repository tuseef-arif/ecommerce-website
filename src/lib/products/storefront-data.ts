import "server-only";

import { formatCategoryLabel } from "@/lib/categories/format-category-label";
import { SITE_PRODUCT_SLIDER } from "@/lib/config/site-config";
import { prisma } from "@/lib/prisma";
import {
  finalProductPrice,
  type ProductDiscountTypeValue,
} from "@/lib/products/discount";
import { formatProductPriceAmount } from "@/lib/products/format-price";
import { safeProductImageSrc } from "@/lib/products/safe-image-src";
import {
  colorOptionsJsonToList,
  keyFeaturesJsonToList,
  specsJsonToEntries,
  storageOptionsJsonToList,
} from "@/lib/products/specs";
import type {
  StorefrontProductCardItem,
  StorefrontProductDetail,
} from "@/lib/products/storefront-types";

const DEFAULT_FEATURED_LIMIT = 12;
const MAX_FEATURED_LIMIT = 15;

/**
 * Default page size for the public `/products` listing — 20 cards renders
 * cleanly on a 4-column desktop grid (5 rows) and is small enough to keep
 * each lazy-load round-trip snappy on mobile networks.
 */
export const STORE_PRODUCTS_PAGE_SIZE = 20;

/** Hard cap on lazy-load page size to bound DB work even if a client lies. */
const MAX_STORE_PRODUCTS_PAGE_SIZE = 60;

/** Hard cap on the offset we'll honour from clients (defensive). */
const MAX_STORE_PRODUCTS_OFFSET = 10_000;

/**
 * Builds the green "% OFF" / "Rs … OFF" badge label for the product card.
 * Returns `null` when no discount should surface (inactive, zero, or
 * unrecognised type) so the card simply omits the badge.
 */
const buildDiscountLabel = (input: {
  discountType: ProductDiscountTypeValue;
  discountValue: number | null;
  isDiscountActive: boolean;
}): string | null => {
  if (!input.isDiscountActive) return null;
  if (input.discountValue === null || input.discountValue <= 0) return null;

  const suffix = SITE_PRODUCT_SLIDER.discountBadgeSuffix;

  if (input.discountType === "PERCENT") {
    const clamped = Math.min(100, Math.max(0, input.discountValue));
    const rounded = Math.round(clamped * 10) / 10;
    const display = Number.isInteger(rounded)
      ? rounded.toFixed(0)
      : rounded.toFixed(1);
    return `${display}% ${suffix}`;
  }

  if (input.discountType === "FIXED") {
    return `${SITE_PRODUCT_SLIDER.pricePrefix} ${formatProductPriceAmount(
      input.discountValue,
    )} ${suffix}`;
  }

  return null;
};

const isUnknownFlagArgumentError = (
  error: unknown,
  fieldName: "isNewArrival" | "isOnSale",
): boolean => {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return new RegExp(`Unknown argument \`${fieldName}\``, "i").test(message);
};

const isMissingFlagColumnError = (
  error: unknown,
  fieldName: "isNewArrival" | "isOnSale",
): boolean => {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return (
    message.includes(`column "${fieldName}" does not exist`) ||
    message.includes("Code: `42703`")
  );
};

type ProductCardRow = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  imagePath: string | null;
  stock: number;
  colorOptions: unknown;
  storageOptions: unknown;
  price: { toString: () => string } | number;
  discountType: ProductDiscountTypeValue;
  discountValue: { toString: () => string } | number | null;
  isDiscountActive: boolean;
};

const toCardItem = (row: ProductCardRow): StorefrontProductCardItem => {
  const price = Number(row.price);
  const discountValue =
    row.discountValue === null ? null : Number(row.discountValue);
  const finalPrice = finalProductPrice({
    price,
    discountType: row.discountType,
    discountValue,
    isDiscountActive: row.isDiscountActive,
  });

  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    slug: row.slug,
    href: `/products/${row.slug}`,
    imagePath: safeProductImageSrc(row.imagePath),
    stock: row.stock,
    isInStock: row.stock > 0,
    colorOptions: colorOptionsJsonToList(row.colorOptions),
    storageOptions: storageOptionsJsonToList(row.storageOptions),
    price,
    finalPrice,
    discountLabel: buildDiscountLabel({
      discountType: row.discountType,
      discountValue,
      isDiscountActive: row.isDiscountActive,
    }),
  } satisfies StorefrontProductCardItem;
};

type FeaturedListOptions = {
  limit?: number;
  /** Drop a specific product (e.g. the one currently being viewed). */
  excludeProductId?: string;
};

/**
 * Returns active products for a category slug, shaped for the
 * storefront `ProductCard` / `ProductSlider`.
 *
 * Ordering: discounted products first (deals up top), then newest. This keeps
 * "Sale!" cards in front of the rail when the catalog has a mix.
 */
export const listFeaturedProductsByCategorySlug = async (
  categorySlug: string,
  options: FeaturedListOptions = {},
): Promise<StorefrontProductCardItem[]> => {
  const slug = categorySlug.trim().toLowerCase();
  if (slug.length === 0) return [];

  const take = Math.min(
    MAX_FEATURED_LIMIT,
    Math.max(1, Math.trunc(options.limit ?? DEFAULT_FEATURED_LIMIT)),
  );

  const excludeId = options.excludeProductId?.trim();

  const rows = await prisma.product.findMany({
    where: {
      isActive: true,
      category: { slug: { equals: slug, mode: "insensitive" } },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    orderBy: [{ isDiscountActive: "desc" }, { updatedAt: "desc" }],
    take,
    select: {
      id: true,
      name: true,
      slug: true,
      brand: true,
      imagePath: true,
      stock: true,
      colorOptions: true,
      storageOptions: true,
      price: true,
      discountType: true,
      discountValue: true,
      isDiscountActive: true,
    },
  });

  return rows.map(toCardItem);
};

/**
 * Returns active products flagged by admins as "new arrivals".
 * Ordered with discounted items first, then newest updates.
 */
export const listFeaturedNewArrivalProducts = async (
  options: FeaturedListOptions = {},
): Promise<StorefrontProductCardItem[]> => {
  const take = Math.min(
    MAX_FEATURED_LIMIT,
    Math.max(1, Math.trunc(options.limit ?? DEFAULT_FEATURED_LIMIT)),
  );
  const excludeId = options.excludeProductId?.trim();

  let rows: ProductCardRow[];
  try {
    if (excludeId) {
      rows = await prisma.$queryRaw<ProductCardRow[]>`
        SELECT
          "id",
          "name",
          "slug",
          "brand",
          "imagePath",
          "stock",
          "colorOptions",
          "storageOptions",
          "price",
          "discountType",
          "discountValue",
          "isDiscountActive"
        FROM "Product"
        WHERE "isActive" = true
          AND "isNewArrival" = true
          AND "id" <> ${excludeId}
        ORDER BY "isDiscountActive" DESC, "updatedAt" DESC
        LIMIT ${take}
      `;
    } else {
      rows = await prisma.$queryRaw<ProductCardRow[]>`
        SELECT
          "id",
          "name",
          "slug",
          "brand",
          "imagePath",
          "stock",
          "colorOptions",
          "storageOptions",
          "price",
          "discountType",
          "discountValue",
          "isDiscountActive"
        FROM "Product"
        WHERE "isActive" = true
          AND "isNewArrival" = true
        ORDER BY "isDiscountActive" DESC, "updatedAt" DESC
        LIMIT ${take}
      `;
    }
  } catch (error) {
    if (
      isUnknownFlagArgumentError(error, "isNewArrival") ||
      isMissingFlagColumnError(error, "isNewArrival")
    ) {
      // Runtime Prisma client is stale; degrade gracefully until regenerated.
      return [];
    }
    throw error;
  }

  return rows.map(toCardItem);
};

/**
 * Returns active products flagged by admins for the "On Sale" rail.
 * Ordered with discounted items first, then newest updates.
 */
export const listFeaturedOnSaleProducts = async (
  options: FeaturedListOptions = {},
): Promise<StorefrontProductCardItem[]> => {
  const take = Math.min(
    MAX_FEATURED_LIMIT,
    Math.max(1, Math.trunc(options.limit ?? DEFAULT_FEATURED_LIMIT)),
  );
  const excludeId = options.excludeProductId?.trim();

  let rows: ProductCardRow[];
  try {
    if (excludeId) {
      rows = await prisma.$queryRaw<ProductCardRow[]>`
        SELECT
          "id",
          "name",
          "slug",
          "brand",
          "imagePath",
          "stock",
          "colorOptions",
          "storageOptions",
          "price",
          "discountType",
          "discountValue",
          "isDiscountActive"
        FROM "Product"
        WHERE "isActive" = true
          AND "isOnSale" = true
          AND "id" <> ${excludeId}
        ORDER BY "isDiscountActive" DESC, "updatedAt" DESC
        LIMIT ${take}
      `;
    } else {
      rows = await prisma.$queryRaw<ProductCardRow[]>`
        SELECT
          "id",
          "name",
          "slug",
          "brand",
          "imagePath",
          "stock",
          "colorOptions",
          "storageOptions",
          "price",
          "discountType",
          "discountValue",
          "isDiscountActive"
        FROM "Product"
        WHERE "isActive" = true
          AND "isOnSale" = true
        ORDER BY "isDiscountActive" DESC, "updatedAt" DESC
        LIMIT ${take}
      `;
    }
  } catch (error) {
    if (
      isUnknownFlagArgumentError(error, "isOnSale") ||
      isMissingFlagColumnError(error, "isOnSale")
    ) {
      return [];
    }
    throw error;
  }

  return rows.map(toCardItem);
};

/**
 * Fetches a single active product by slug for the public detail page.
 * Returns `null` for unknown / inactive slugs so the route can call
 * `notFound()` cleanly.
 *
 * The slug is the only user-supplied input on the route; Prisma binds it as
 * a parameter so SQL injection is not in play.
 */
export const getStorefrontProductBySlug = async (
  rawSlug: string,
): Promise<StorefrontProductDetail | null> => {
  const slug = rawSlug.trim().toLowerCase();
  if (slug.length === 0) return null;

  const row = await prisma.product.findFirst({
    where: { slug, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      brand: true,
      model: true,
      productType: true,
      description: true,
      imagePath: true,
      price: true,
      discountType: true,
      discountValue: true,
      isDiscountActive: true,
      stock: true,
      specs: true,
      keyFeatures: true,
      colorOptions: true,
      storageOptions: true,
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!row) return null;

  const card = toCardItem(row);

  return {
    ...card,
    brand: row.brand,
    model: row.model,
    productType: row.productType,
    description: row.description,
    stock: row.stock,
    isInStock: row.stock > 0,
    category: {
      id: row.category.id,
      slug: row.category.slug,
      name: formatCategoryLabel(row.category.slug || row.category.name),
    },
    specs: specsJsonToEntries(row.specs),
    keyFeatures: keyFeaturesJsonToList(row.keyFeatures),
    colorOptions: colorOptionsJsonToList(row.colorOptions),
    storageOptions: storageOptionsJsonToList(row.storageOptions),
  } satisfies StorefrontProductDetail;
};

export type StorefrontProductsPageInput = {
  /** Optional category slug; empty/missing => "All products". */
  categorySlug?: string;
  /** Optional brand filter (case-insensitive exact match). */
  brand?: string;
  /** Optional min price filter (inclusive). */
  minPrice?: number | null;
  /** Optional max price filter (inclusive). */
  maxPrice?: number | null;
  /** Sort order for listing cards. */
  sort?: StorefrontProductsSort;
  /** Items to skip — `0` for the first page. */
  skip: number;
  /** Page size requested; clamped server-side. */
  take: number;
};

export type StorefrontProductsPage = {
  /** Cards for the requested page slice. */
  items: StorefrontProductCardItem[];
  /** Total active matches (pre-pagination). */
  total: number;
  /** Whether more rows exist after the returned slice. */
  hasMore: boolean;
};

type StorefrontSearchProductsInput = {
  /** User query used to match product name, brand, and model fields. */
  query: string;
  /** Max cards to return; clamped server-side. */
  take?: number;
};

type StorefrontFilterCategoryOption = {
  id: string;
  slug: string;
  name: string;
};

export type StorefrontProductsSort = "latest" | "price-desc" | "price-asc";

/**
 * Looks up a category by slug for the public `/products` listing route.
 * Returns `null` for unknown slugs so the route can call `notFound()` for
 * invalid `?category=` values.
 */
export const findStorefrontCategoryBySlug = async (
  rawSlug: string,
): Promise<{ id: string; slug: string; name: string } | null> => {
  const slug = rawSlug.trim().toLowerCase();
  if (slug.length === 0) return null;
  const row = await prisma.category.findFirst({
    where: { slug },
    select: { id: true, slug: true, name: true },
  });
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: formatCategoryLabel(row.slug || row.name),
  };
};

/**
 * Returns a paginated slice of active products for the public
 * listing page (`/products?category=…&brand=…`). Mirrors the rail's
 * "deals first, then newest" ordering so featured cards stay consistent.
 *
 * Inputs are clamped server-side so a hostile client cannot exhaust the DB
 * with a huge `take` or wildly large `skip`. Filters are bound as Prisma
 * parameters — never interpolated into SQL.
 */
export const listStorefrontProductsPage = async (
  input: StorefrontProductsPageInput,
): Promise<StorefrontProductsPage> => {
  const slug = (input.categorySlug ?? "").trim().toLowerCase();
  const brand = (input.brand ?? "").trim();
  const sort = input.sort ?? "latest";
  const minPrice =
    typeof input.minPrice === "number" && Number.isFinite(input.minPrice)
      ? Math.max(0, input.minPrice)
      : null;
  const maxPrice =
    typeof input.maxPrice === "number" && Number.isFinite(input.maxPrice)
      ? Math.max(0, input.maxPrice)
      : null;

  const take = Math.max(
    1,
    Math.min(MAX_STORE_PRODUCTS_PAGE_SIZE, Math.trunc(input.take)),
  );
  const skip = Math.max(
    0,
    Math.min(MAX_STORE_PRODUCTS_OFFSET, Math.trunc(input.skip)),
  );

  const where: Record<string, unknown> = {
    isActive: true,
  };
  if (slug.length > 0) {
    where.category = { slug: { equals: slug, mode: "insensitive" } };
  }
  if (brand.length > 0) {
    where.brand = { equals: brand, mode: "insensitive" };
  }
  if (minPrice !== null || maxPrice !== null) {
    where.price = {
      ...(minPrice !== null ? { gte: minPrice } : {}),
      ...(maxPrice !== null ? { lte: maxPrice } : {}),
    };
  }

  const orderBy =
    sort === "price-asc"
      ? [{ price: "asc" as const }, { id: "desc" as const }]
      : sort === "price-desc"
        ? [{ price: "desc" as const }, { id: "desc" as const }]
        : [
            { isDiscountActive: "desc" as const },
            { updatedAt: "desc" as const },
            { id: "desc" as const },
          ];

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true,
        name: true,
        slug: true,
        brand: true,
        imagePath: true,
        stock: true,
        colorOptions: true,
        storageOptions: true,
        price: true,
        discountType: true,
        discountValue: true,
        isDiscountActive: true,
      },
    }),
    prisma.product.count({ where }),
  ]);

  const items = rows.map(toCardItem);
  const hasMore = skip + items.length < total;

  return { items, total, hasMore };
};

/**
 * Product-only catalog search used by `/search`.
 * Returns active cards matching name/brand/model (case-insensitive).
 */
export const searchStorefrontProducts = async (
  input: StorefrontSearchProductsInput,
): Promise<StorefrontProductCardItem[]> => {
  const rawQuery = input.query.trim();
  if (rawQuery.length === 0) return [];

  const take = Math.max(
    1,
    Math.min(
      MAX_STORE_PRODUCTS_PAGE_SIZE,
      Math.trunc(input.take ?? STORE_PRODUCTS_PAGE_SIZE),
    ),
  );

  const rows = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: rawQuery, mode: "insensitive" } },
        { brand: { contains: rawQuery, mode: "insensitive" } },
        { model: { contains: rawQuery, mode: "insensitive" } },
      ],
    },
    orderBy: [
      { isDiscountActive: "desc" },
      { updatedAt: "desc" },
      { id: "desc" },
    ],
    take,
    select: {
      id: true,
      name: true,
      slug: true,
      brand: true,
      imagePath: true,
      stock: true,
      colorOptions: true,
      storageOptions: true,
      price: true,
      discountType: true,
      discountValue: true,
      isDiscountActive: true,
    },
  });

  return rows.map(toCardItem);
};

/**
 * Returns active product cards for the supplied ids, preserving the input
 * order. Missing/inactive ids are silently dropped so callers can pass a
 * stale list without erroring (used by the hero banner deep-link page).
 */
export const listStorefrontProductsByIds = async (
  ids: ReadonlyArray<string>,
): Promise<StorefrontProductCardItem[]> => {
  if (ids.length === 0) return [];

  const uniqueIds = Array.from(new Set(ids));
  const rows = await prisma.product.findMany({
    where: { id: { in: uniqueIds }, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      brand: true,
      imagePath: true,
      stock: true,
      colorOptions: true,
      storageOptions: true,
      price: true,
      discountType: true,
      discountValue: true,
      isDiscountActive: true,
    },
  });

  const byId = new Map(rows.map((row) => [row.id, toCardItem(row)]));
  const items: StorefrontProductCardItem[] = [];
  for (const id of ids) {
    const item = byId.get(id);
    if (item) items.push(item);
  }
  return items;
};

/**
 * Returns distinct storefront brands for filter dropdowns.
 * Optionally scopes brands by category slug.
 */
export const listStorefrontDistinctBrands = async (
  categorySlug?: string,
): Promise<string[]> => {
  const slug = (categorySlug ?? "").trim().toLowerCase();
  const rows = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(slug.length > 0
        ? { category: { slug: { equals: slug, mode: "insensitive" } } }
        : {}),
    },
    distinct: ["brand"],
    orderBy: { brand: "asc" },
    select: { brand: true },
  });

  return rows
    .map((row) => row.brand)
    .filter((brand) => brand.trim().length > 0);
};

/**
 * Returns category options for the public `/products` category filter.
 * Includes only categories with at least one active product.
 */
export const listStorefrontFilterCategories = async (): Promise<
  StorefrontFilterCategoryOption[]
> => {
  const rows = await prisma.category.findMany({
    where: {
      products: {
        some: {
          isActive: true,
        },
      },
    },
    orderBy: { name: "asc" },
    select: { id: true, slug: true, name: true },
  });

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: formatCategoryLabel(row.slug || row.name),
  }));
};
