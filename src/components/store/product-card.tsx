import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProductImageWithFallback } from "@/components/store/product-image-with-fallback";
import { ProductCardAddToCartButton } from "@/components/store/product-card-add-to-cart-button";
import { SITE_PRODUCT_SLIDER } from "@/lib/config/site-config";
import { formatProductPriceWithPrefix } from "@/lib/products/format-price";
import type { StorefrontProductCardItem } from "@/lib/products/storefront-types";

type ProductCardProps = {
  product: StorefrontProductCardItem;
  /** Marks the LCP-eligible image (first card in the first rail). */
  isPriority?: boolean;
  /**
   * `rail`: fixed widths + `shrink-0` for horizontal `ProductSlider` tracks.
   * `grid`: fills the CSS grid cell (`w-full min-w-0`) so columns stay even
   * and breakpoints control density — do not pass for sliders.
   */
  layout?: "rail" | "grid";
};

/**
 * Presentational product card used in `ProductSlider` and any future grid.
 * Server-renderable (no hooks, no `'use client'`); the "Add to cart" button
 * is intentionally UI-only — wire it once cart actions land.
 *
 * The whole card is _not_ a single anchor: image + name link to the detail
 * page, and the CTA stays a sibling button so we don't nest interactives.
 */
export const ProductCard = ({
  product,
  isPriority = false,
  layout = "rail",
}: ProductCardProps) => {
  const { name, href, imagePath, price, finalPrice, discountLabel } = product;
  const isInStock = product.isInStock;

  const hasDiscount = finalPrice < price;
  const pricePrefix = SITE_PRODUCT_SLIDER.pricePrefix;
  const priceLabel = formatProductPriceWithPrefix(price, pricePrefix);
  const finalPriceLabel = formatProductPriceWithPrefix(finalPrice, pricePrefix);

  const articleClass =
    layout === "grid"
      ? "group relative flex w-full min-w-0 max-w-full shrink flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md focus-within:-translate-y-0.5 focus-within:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-within:translate-y-0"
      : "group relative flex w-44 shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md focus-within:-translate-y-0.5 focus-within:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-within:translate-y-0 sm:w-48 md:w-56 lg:w-60";

  const imagePaddingClass = layout === "grid" ? "p-2 sm:p-3" : "p-3";

  return (
    <article className={articleClass}>
      {hasDiscount ? (
        <span
          className="absolute left-3 top-3 z-10 inline-flex items-center rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm"
          aria-hidden
        >
          {SITE_PRODUCT_SLIDER.saleBadgeLabel}
        </span>
      ) : null}

      {discountLabel ? (
        <StatusBadge
          tone="success"
          className="absolute right-3 top-3 z-10 px-2.5 py-1 text-[10px] uppercase tracking-wide shadow-sm"
        >
          {discountLabel}
        </StatusBadge>
      ) : null}

      <Link
        href={href}
        className="flex flex-1 flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
      >
        <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-neutral-50">
          <ProductImageWithFallback
            src={imagePath}
            alt={layout === "grid" ? "" : name}
            className={`h-full w-full object-contain ${imagePaddingClass} transition-transform duration-300 ease-out group-hover:scale-105 group-focus-within:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-focus-within:scale-100`}
            loading={isPriority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={isPriority ? "high" : "auto"}
          />
        </div>

        <h3
          className={
            layout === "grid"
              ? "line-clamp-2 px-3 pt-2.5 text-[0.8125rem] font-medium leading-snug text-neutral-800 transition-colors duration-150 group-hover:text-[var(--store-brand-primary)] group-focus-within:text-[var(--store-brand-primary)] sm:px-4 sm:pt-3 sm:text-sm md:text-[0.9375rem]"
              : "line-clamp-2 px-4 pt-3 text-sm font-medium leading-snug text-neutral-800 transition-colors duration-150 group-hover:text-[var(--store-brand-primary)] group-focus-within:text-[var(--store-brand-primary)] sm:text-[0.9375rem]"
          }
        >
          {name}
        </h3>

        <p
          className={
            layout === "grid"
              ? "mt-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 px-3 pb-2 sm:mt-2 sm:gap-x-2 sm:px-4 sm:pb-3"
              : "mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 px-4 pb-3"
          }
        >
          {hasDiscount ? (
            <>
              <span
                className={
                  layout === "grid"
                    ? "text-[0.6875rem] text-neutral-400 line-through tabular-nums sm:text-xs md:text-sm"
                    : "text-xs text-neutral-400 line-through tabular-nums sm:text-sm"
                }
              >
                {priceLabel}
              </span>
              <span
                className={
                  layout === "grid"
                    ? "text-sm font-bold text-neutral-900 tabular-nums sm:text-base md:text-lg"
                    : "text-base font-bold text-neutral-900 tabular-nums sm:text-lg"
                }
              >
                {finalPriceLabel}
              </span>
            </>
          ) : (
            <span
              className={
                layout === "grid"
                  ? "text-sm font-bold text-neutral-900 tabular-nums sm:text-base md:text-lg"
                  : "text-base font-bold text-neutral-900 tabular-nums sm:text-lg"
              }
            >
              {priceLabel}
            </span>
          )}
        </p>
      </Link>

      <div
        className={
          layout === "grid"
            ? "px-2 pb-2 pt-0.5 sm:px-3 sm:pb-3 sm:pt-1"
            : "px-3 pb-3 pt-1"
        }
      >
        <ProductCardAddToCartButton
          productId={product.id}
          productName={name}
          href={href}
          imagePath={imagePath}
          originalUnitPrice={price}
          unitPrice={finalPrice}
          stock={product.stock}
          isInStock={isInStock}
          colorOptions={product.colorOptions}
          storageOptions={product.storageOptions}
        />
      </div>
    </article>
  );
};
