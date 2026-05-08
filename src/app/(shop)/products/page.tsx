import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductLazyGrid } from "@/components/store/product-lazy-grid";
import { ProductsListingFilters } from "@/components/store/products-listing-filters";
import { Button } from "@/components/ui/button";
import {
  SITE_PRODUCTS_LISTING_PAGE,
  SITE_ROUTES,
  STORE_BUSINESS_NAME,
  STORE_SHELL,
} from "@/lib/config/site-config";
import {
  STORE_PRODUCTS_PAGE_SIZE,
  findStorefrontCategoryBySlug,
  listStorefrontDistinctBrands,
  listStorefrontFilterCategories,
  listStorefrontProductsPage,
  type StorefrontProductsSort,
} from "@/lib/products/storefront-data";

type ProductsListingSearchParams = {
  category?: string | string[];
  brand?: string | string[];
  sort?: string | string[];
  minPrice?: string | string[];
  maxPrice?: string | string[];
};

type ProductsListingPageProps = {
  searchParams: Promise<ProductsListingSearchParams>;
};

const sanitizeSingle = (
  value: string | string[] | undefined,
  maxLength: number,
): string => {
  let raw = value;
  if (Array.isArray(raw)) raw = raw[0];
  if (typeof raw !== "string") return "";
  return raw.trim().slice(0, maxLength);
};

const parseSort = (
  value: string | string[] | undefined,
): StorefrontProductsSort => {
  const raw = sanitizeSingle(value, 24).toLowerCase();
  if (raw === "price-desc" || raw === "price-asc") return raw;
  return "latest";
};

const parsePriceBound = (
  value: string | string[] | undefined,
): number | null => {
  const raw = sanitizeSingle(value, 20);
  if (raw.length === 0) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return null;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
};

const interpolate = (
  template: string,
  values: Record<string, string>,
): string =>
  Object.entries(values).reduce(
    (acc, [key, replacement]) => acc.replaceAll(`{${key}}`, replacement.trim()),
    template,
  );

/** Title-cases a brand string for display (e.g. `samsung` → `Samsung`). */
const formatBrandDisplay = (raw: string): string => {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return "";
  return trimmed
    .split(/\s+/)
    .map((part) =>
      part.length === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(" ");
};

export const generateMetadata = async ({
  searchParams,
}: ProductsListingPageProps): Promise<Metadata> => {
  const resolved = await searchParams;
  const rawCategory = sanitizeSingle(resolved.category, 80).toLowerCase();
  const rawBrand = sanitizeSingle(resolved.brand, 80);

  const copy = SITE_PRODUCTS_LISTING_PAGE;

  if (rawCategory.length === 0) {
    return {
      title: copy.metaTitleAllPattern,
      description: interpolate(copy.metaDescriptionAllPattern, {
        business: STORE_BUSINESS_NAME,
      }),
    };
  }

  const category = await findStorefrontCategoryBySlug(rawCategory);
  if (!category) {
    return {
      title: copy.metaTitleAllPattern,
      description: interpolate(copy.metaDescriptionAllPattern, {
        business: STORE_BUSINESS_NAME,
      }),
    };
  }

  if (rawBrand.length > 0) {
    const brandDisplay = formatBrandDisplay(rawBrand);
    return {
      title: interpolate(copy.metaTitleCategoryAndBrandPattern, {
        category: category.name,
        brand: brandDisplay,
      }),
      description: interpolate(copy.metaDescriptionCategoryAndBrandPattern, {
        category: category.name.toLowerCase(),
        brand: brandDisplay,
        business: STORE_BUSINESS_NAME,
      }),
    };
  }

  return {
    title: interpolate(copy.metaTitleCategoryPattern, {
      category: category.name,
    }),
    description: interpolate(copy.metaDescriptionCategoryPattern, {
      category: category.name.toLowerCase(),
      business: STORE_BUSINESS_NAME,
    }),
  };
};

export default async function ProductsListingPage({
  searchParams,
}: ProductsListingPageProps) {
  const resolved = await searchParams;
  const rawCategory = sanitizeSingle(resolved.category, 80).toLowerCase();
  const rawBrand = sanitizeSingle(resolved.brand, 80);
  const rawSort = parseSort(resolved.sort);
  const rawMinPrice = parsePriceBound(resolved.minPrice);
  const rawMaxPrice = parsePriceBound(resolved.maxPrice);

  const copy = SITE_PRODUCTS_LISTING_PAGE;

  let category: { id: string; slug: string; name: string } | null = null;
  if (rawCategory.length > 0) {
    category = await findStorefrontCategoryBySlug(rawCategory);
    if (!category) notFound();
  }

  const [initialPage, brandOptions, categoryOptions] = await Promise.all([
    listStorefrontProductsPage({
      categorySlug: category?.slug ?? "",
      brand: rawBrand,
      minPrice: rawMinPrice,
      maxPrice: rawMaxPrice,
      sort: rawSort,
      skip: 0,
      take: STORE_PRODUCTS_PAGE_SIZE,
    }),
    listStorefrontDistinctBrands(category?.slug ?? ""),
    listStorefrontFilterCategories(),
  ]);

  const heading = copy.pageHeadingAllProducts;
  const resultLabel =
    initialPage.total === 1
      ? copy.resultCountSingular
      : interpolate(copy.resultCountPattern, {
          count: initialPage.total.toLocaleString(),
        });

  const browseAllHref = "/products";
  const hasActiveFilters =
    rawCategory.length > 0 ||
    rawBrand.length > 0 ||
    rawSort !== "latest" ||
    rawMinPrice !== null ||
    rawMaxPrice !== null;
  const isEmpty = initialPage.items.length === 0;

  return (
    <main
      className={`flex flex-1 flex-col gap-6 py-6 md:gap-8 md:py-10 ${STORE_SHELL}`}
    >
      <div className="flex items-center justify-between gap-3 text-xs text-neutral-500 sm:text-sm">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link
                href={SITE_ROUTES.home}
                className="hover:text-[var(--store-brand-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
              >
                {copy.breadcrumbHomeLabel}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="truncate text-neutral-700">
              {copy.breadcrumbAllProductsLabel}
            </li>
            {category ? (
              <>
                <li aria-hidden>/</li>
                <li className="truncate text-neutral-700">{category.name}</li>
              </>
            ) : null}
          </ol>
        </nav>
        <div className="flex items-center gap-1.5 text-right text-xs tracking-wide text-neutral-500 sm:gap-2 sm:text-sm">
          {hasActiveFilters ? (
            <Link
              href={browseAllHref}
              className="text-neutral-500 transition-colors hover:text-[var(--store-brand-primary)]"
            >
              Clear Filters
            </Link>
          ) : null}
          <span aria-hidden>{hasActiveFilters ? "-" : null}</span>
          <p>{resultLabel}</p>
        </div>
      </div>

      <header className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <h1 className="sr-only">{heading}</h1>
          <ProductsListingFilters
            className="ml-auto w-[min(82vw,44rem)] min-w-[16rem]"
            categoryOptions={categoryOptions}
            selectedCategory={rawCategory}
            brandOptions={brandOptions}
            selectedBrand={rawBrand}
            selectedMinPrice={rawMinPrice}
            selectedMaxPrice={rawMaxPrice}
            selectedSort={rawSort}
            labels={{
              category: copy.filterCategoryLabel,
              allCategories: copy.filterCategoryAllOptionLabel,
              brand: copy.filterBrandLabel,
              allBrands: copy.filterBrandAllOptionLabel,
              sortBy: copy.filterSortByLabel,
              sortLatest: copy.filterSortLatestLabel,
              sortPriceHighToLow: copy.filterSortPriceHighToLowLabel,
              sortPriceLowToHigh: copy.filterSortPriceLowToHighLabel,
            }}
          />
        </div>
      </header>

      {isEmpty ? (
        <section
          aria-label={copy.emptyStateTitle}
          className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-12 text-center"
        >
          <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">
            {copy.emptyStateTitle}
          </h2>
          <p className="max-w-md text-sm text-neutral-600">
            {copy.emptyStateLead}
          </p>
          <Link href={browseAllHref} className="mt-1 inline-flex">
            <Button type="button" variant="primary" size="md">
              {copy.emptyStateBrowseAllCta}
            </Button>
          </Link>
        </section>
      ) : (
        <ProductLazyGrid
          key={`${category?.slug ?? "all"}|${rawBrand.trim().toLowerCase()}|${rawSort}|${rawMinPrice ?? "none"}|${rawMaxPrice ?? "none"}`}
          initialItems={initialPage.items}
          initialHasMore={initialPage.hasMore}
          categorySlug={category?.slug ?? ""}
          brand={rawBrand}
          minPrice={rawMinPrice}
          maxPrice={rawMaxPrice}
          sort={rawSort}
        />
      )}
    </main>
  );
}
