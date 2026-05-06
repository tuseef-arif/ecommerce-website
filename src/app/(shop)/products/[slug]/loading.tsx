import { STORE_SHELL } from "@/lib/config/site-config";

/**
 * Skeleton placeholder shown while the detail page resolves.
 * Mirrors the final layout (image + info + spec strip + rail) so the page
 * shape is stable between server render and hydration.
 */
export default function ProductDetailLoading() {
  return (
    <main
      aria-busy
      className={`flex flex-1 flex-col gap-10 py-8 md:py-10 ${STORE_SHELL}`}
    >
      <div className="h-3 w-40 rounded-full bg-neutral-100 sm:h-4 sm:w-56" />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
        <div className="aspect-square w-full animate-pulse rounded-2xl bg-neutral-100" />
        <div className="flex flex-col gap-4">
          <div className="h-3 w-24 animate-pulse rounded-full bg-neutral-100" />
          <div className="h-7 w-3/4 animate-pulse rounded-md bg-neutral-100" />
          <div className="h-4 w-1/2 animate-pulse rounded-md bg-neutral-100" />
          <div className="h-9 w-40 animate-pulse rounded-md bg-neutral-100" />
          <div className="mt-4 h-12 w-full animate-pulse rounded-full bg-neutral-100" />
        </div>
      </div>

      <div className="h-40 w-full animate-pulse rounded-2xl bg-neutral-100" />

      <div className="flex flex-col gap-3">
        <div className="h-5 w-48 animate-pulse rounded-md bg-neutral-100" />
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="aspect-[3/4] w-44 shrink-0 animate-pulse rounded-2xl bg-neutral-100 sm:w-48 md:w-56 lg:w-60"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
