"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ProductCard } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";
import { loadMoreStorefrontProductsAction } from "@/app/(shop)/products/actions";
import { SITE_PRODUCTS_LISTING_PAGE } from "@/lib/config/site-config";
import type { StorefrontProductCardItem } from "@/lib/products/storefront-types";

type StorefrontProductsSort = "latest" | "price-desc" | "price-asc";

/**
 * Category / all-products listing grid. Stays on **2 columns** through the
 * `sm` range (common “large phone” widths) so cards stay wide enough to read;
 * only steps to 3+ from `md`. Caps at **5** columns on ultra-wide viewports
 * so cards do not become razor-thin rails.
 */
export const STORE_PRODUCT_LISTING_GRID_CLASS =
  "grid list-none grid-cols-1 gap-x-3 gap-y-5 p-0 min-[360px]:grid-cols-2 min-[360px]:gap-x-4 min-[360px]:gap-y-6 sm:gap-x-5 sm:gap-y-6 md:grid-cols-3 md:gap-x-6 md:gap-y-7 lg:grid-cols-4 xl:grid-cols-5";

type ProductLazyGridProps = {
  /** First page rendered on the server so the route remains SSR-friendly. */
  initialItems: ReadonlyArray<StorefrontProductCardItem>;
  /** Whether more rows exist after the initial slice. */
  initialHasMore: boolean;
  /** Active category filter (lower-cased slug or empty string for "all"). */
  categorySlug: string;
  /** Active brand filter (free text or empty string when not filtered). */
  brand: string;
  /** Active sort mode for listing results. */
  sort: StorefrontProductsSort;
};

/**
 * Storefront product grid with infinite scroll. Renders 20 cards on first
 * paint (server-rendered) and lazy-loads more pages via a Server Action as
 * the sentinel scrolls into view, until the catalog is exhausted.
 *
 * The "Load more" button is also kept clickable for keyboard users and
 * screen-reader fallbacks; the IntersectionObserver triggers it when the
 * sentinel approaches the viewport.
 */
export const ProductLazyGrid = ({
  initialItems,
  initialHasMore,
  categorySlug,
  brand,
  sort,
}: ProductLazyGridProps) => {
  const [items, setItems] = useState<StorefrontProductCardItem[]>(() => [
    ...initialItems,
  ]);
  const [skip, setSkip] = useState<number>(initialItems.length);
  const [hasMore, setHasMore] = useState<boolean>(initialHasMore);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sentinelRef = useRef<HTMLDivElement>(null);
  const inFlightRef = useRef(false);

  const loadMore = useCallback(() => {
    if (inFlightRef.current) return;
    if (!hasMore) return;
    inFlightRef.current = true;
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const result = await loadMoreStorefrontProductsAction({
          categorySlug,
          brand,
          sort,
          skip,
        });

        if (!result.ok) {
          setErrorMessage(SITE_PRODUCTS_LISTING_PAGE.loadMoreErrorMessage);
          return;
        }

        if (result.items.length === 0) {
          setHasMore(false);
          return;
        }

        setItems((prev) => {
          const seen = new Set(prev.map((item) => item.id));
          const additions = result.items.filter((item) => !seen.has(item.id));
          return [...prev, ...additions];
        });
        setSkip(result.nextSkip);
        setHasMore(result.hasMore);
      } catch (error) {
        console.error("ProductLazyGrid load-more failed", error);
        setErrorMessage(SITE_PRODUCTS_LISTING_PAGE.loadMoreErrorMessage);
      } finally {
        inFlightRef.current = false;
      }
    });
  }, [brand, categorySlug, hasMore, skip, sort]);

  useEffect(() => {
    if (!hasMore) return undefined;
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (isPending || inFlightRef.current) return;
        loadMore();
      },
      { rootMargin: "320px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isPending, loadMore]);

  const showInitialEmptyState = items.length === 0;

  return (
    <div className="flex flex-col gap-6">
      {showInitialEmptyState ? null : (
        <ul className={STORE_PRODUCT_LISTING_GRID_CLASS}>
          {items.map((product, idx) => (
            <li
              key={product.id}
              className="store-product-grid__item min-w-0 max-w-full"
            >
              <div className="store-product-grid__cell flex h-full justify-stretch">
                <ProductCard
                  product={product}
                  isPriority={idx < 4}
                  layout="grid"
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div
        className="flex flex-col items-center justify-center gap-3 py-4"
        aria-live="polite"
      >
        {hasMore ? (
          <>
            <div ref={sentinelRef} aria-hidden className="h-px w-full" />
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={loadMore}
              isLoading={isPending}
              loadingLabel={SITE_PRODUCTS_LISTING_PAGE.loadingMoreLabel}
            >
              {SITE_PRODUCTS_LISTING_PAGE.loadMoreCta}
            </Button>
          </>
        ) : items.length > 0 ? (
          <p className="text-xs uppercase tracking-wide text-neutral-400">
            {SITE_PRODUCTS_LISTING_PAGE.endOfListLabel}
          </p>
        ) : null}

        {errorMessage ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-2 text-sm text-red-700"
          >
            <span>{errorMessage}</span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={loadMore}
            >
              {SITE_PRODUCTS_LISTING_PAGE.loadMoreRetryCta}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

/** Used by the page's static loading fallback to keep the layout stable. */
export const ProductLazyGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <ul aria-hidden className={STORE_PRODUCT_LISTING_GRID_CLASS}>
    {Array.from({ length: count }).map((_, idx) => (
      <li key={idx} className="store-product-grid__item min-w-0 max-w-full">
        <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
          <div className="aspect-square w-full animate-pulse bg-neutral-100" />
          <div className="flex flex-col gap-2 p-3">
            <div className="h-3 w-3/4 animate-pulse rounded-full bg-neutral-100" />
            <div className="h-3 w-1/2 animate-pulse rounded-full bg-neutral-100" />
            <div className="mt-2 h-8 w-full animate-pulse rounded-full bg-neutral-100" />
          </div>
        </div>
      </li>
    ))}
  </ul>
);
