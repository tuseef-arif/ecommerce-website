import { ProductLazyGridSkeleton } from "@/components/store/product-lazy-grid";
import { STORE_SHELL } from "@/lib/config/site-config";

/**
 * Skeleton placeholder for the public products listing page. Matches the
 * grid columns of `ProductLazyGrid` so the layout doesn't jump when the
 * server-rendered page swaps in.
 */
export default function ProductsListingLoading() {
  return (
    <main
      aria-busy
      className={`flex flex-1 flex-col gap-6 py-6 md:gap-8 md:py-10 ${STORE_SHELL}`}
    >
      <div className="h-3 w-40 animate-pulse rounded-full bg-neutral-100 sm:h-4 sm:w-56" />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="h-7 w-40 animate-pulse rounded-md bg-neutral-100 sm:h-8 sm:w-56" />
          <div className="h-3 w-24 animate-pulse rounded-full bg-neutral-100" />
        </div>
      </div>

      <ProductLazyGridSkeleton count={12} />
    </main>
  );
}
