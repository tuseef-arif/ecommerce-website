import { ProductLazyGridSkeleton } from "@/components/store/product-lazy-grid";
import { STORE_SHELL } from "@/lib/config/site-config";

export default function BannerSlideLoading() {
  return (
    <main
      aria-busy
      className={`flex flex-1 flex-col gap-6 py-6 md:gap-8 md:py-10 ${STORE_SHELL}`}
    >
      <div className="h-3 w-40 animate-pulse rounded-full bg-neutral-100 sm:h-4 sm:w-56" />
      <div className="flex flex-col gap-2">
        <div className="h-7 w-56 animate-pulse rounded-md bg-neutral-100 sm:h-8 sm:w-72" />
        <div className="h-4 w-40 animate-pulse rounded-md bg-neutral-100" />
      </div>
      <ProductLazyGridSkeleton count={8} />
    </main>
  );
}
