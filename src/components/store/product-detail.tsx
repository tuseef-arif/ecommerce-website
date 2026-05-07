import Link from "next/link";
import { ProductImageWithFallback } from "@/components/store/product-image-with-fallback";
import { ProductPurchasePanel } from "@/components/store/product-purchase-panel";
import { ProductSpecList } from "@/components/store/product-spec-list";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  SITE_PRODUCT_DETAIL,
  SITE_PRODUCT_SLIDER,
  SITE_ROUTES,
} from "@/lib/config/site-config";
import type { StorefrontProductDetail } from "@/lib/products/storefront-types";

type ProductDetailProps = {
  product: StorefrontProductDetail;
};

/**
 * Server-rendered product detail block: media, header, key features, spec
 * table, and breadcrumb. The interactive pricing/variant/CTA strip lives in
 * `ProductPurchasePanel` (a client island) so the price stays in lockstep
 * with the shopper's color/storage selection without forcing the rest of
 * the page out of the server. The related-products rail is rendered as a
 * sibling (see `RelatedProductsRail`).
 */
export const ProductDetail = ({ product }: ProductDetailProps) => {
  const {
    name,
    brand,
    model,
    description,
    imagePath,
    price,
    finalPrice,
    discountLabel,
    isInStock,
    category,
    specs,
    keyFeatures,
    colorOptions,
    storageOptions,
  } = product;

  const hasDiscount = finalPrice < price;

  const categoryHref = `/products?category=${category.slug}`;
  const specsHeadingId = "product-detail-specs-heading";

  return (
    <article className="flex flex-col gap-8">
      <nav
        aria-label="Breadcrumb"
        className="text-xs text-neutral-500 sm:text-sm"
      >
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link
              href={SITE_ROUTES.home}
              className="hover:text-[var(--store-brand-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
            >
              {SITE_PRODUCT_DETAIL.breadcrumbHomeLabel}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link
              href={categoryHref}
              className="hover:text-[var(--store-brand-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
            >
              {category.name || SITE_PRODUCT_DETAIL.breadcrumbCategoryFallback}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="truncate text-neutral-700">{name}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,360px)_1fr] md:gap-10 lg:grid-cols-[minmax(0,400px)_1fr]">
        <section
          aria-label="Product image"
          className="relative w-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50"
        >
          {hasDiscount ? (
            <span
              className="absolute left-3 top-3 z-10 inline-flex items-center rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm sm:left-4 sm:top-4 sm:px-3 sm:text-[11px]"
              aria-hidden
            >
              {SITE_PRODUCT_SLIDER.saleBadgeLabel}
            </span>
          ) : null}
          {discountLabel ? (
            <StatusBadge
              tone="success"
              className="absolute right-3 top-3 z-10 px-2.5 py-1 text-[10px] uppercase tracking-wide shadow-sm sm:right-4 sm:top-4 sm:px-3 sm:text-[11px]"
            >
              {discountLabel}
            </StatusBadge>
          ) : null}
          <div className="relative flex aspect-square items-center justify-center">
            <ProductImageWithFallback
              src={imagePath}
              alt={name}
              className="h-full w-full object-contain p-4 sm:p-6"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          </div>
        </section>

        <section
          aria-label="Product information"
          className="flex min-w-0 flex-col gap-5"
        >
          <header className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              <Link
                href={categoryHref}
                className="font-semibold text-[var(--store-brand-primary)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
              >
                {category.name}
              </Link>
            </p>
            <h1 className="text-2xl font-semibold leading-tight text-neutral-900 sm:text-3xl">
              {name}
            </h1>
            <p className="text-sm text-neutral-600">
              {SITE_PRODUCT_DETAIL.brandLabelPrefix} {brand}
              {model.length > 0
                ? ` · ${SITE_PRODUCT_DETAIL.modelLabel} ${model}`
                : ""}
            </p>
          </header>

          <div>
            <StatusBadge tone={isInStock ? "success" : "danger"}>
              {isInStock
                ? SITE_PRODUCT_DETAIL.inStockLabel
                : SITE_PRODUCT_DETAIL.outOfStockLabel}
            </StatusBadge>
          </div>

          {keyFeatures.length > 0 ? (
            <section aria-label={SITE_PRODUCT_DETAIL.keyFeaturesHeading}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                {SITE_PRODUCT_DETAIL.keyFeaturesHeading}
              </h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-neutral-700 marker:text-[var(--store-brand-primary)]">
                {keyFeatures.map((feature, idx) => (
                  <li key={`${feature}-${idx}`}>{feature}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <ProductPurchasePanel
            productName={name}
            basePrice={price}
            finalBasePrice={finalPrice}
            discountLabel={discountLabel}
            isInStock={isInStock}
            colorOptions={colorOptions}
            storageOptions={storageOptions}
          />
        </section>
      </div>

      {description ? (
        <section
          aria-label={SITE_PRODUCT_DETAIL.descriptionHeading}
          className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6"
        >
          <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">
            {SITE_PRODUCT_DETAIL.descriptionHeading}
          </h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-neutral-700 sm:text-[0.9375rem]">
            {description}
          </p>
        </section>
      ) : null}

      <ProductSpecList
        specs={specs}
        heading={SITE_PRODUCT_DETAIL.specsHeading}
        emptyLabel={SITE_PRODUCT_DETAIL.specsEmpty}
        headingId={specsHeadingId}
      />
    </article>
  );
};
