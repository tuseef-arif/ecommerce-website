import Link from "next/link";
import type { AdminDashboardTopProduct } from "@/lib/dashboard/top-products";

type DashboardTopProductsProps = {
  items: readonly AdminDashboardTopProduct[];
};

export const DashboardTopProducts = ({ items }: DashboardTopProductsProps) => {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-neutral-200 bg-white p-5 text-right shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-neutral-900">Top products</h2>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/80 px-4 py-10 text-left text-sm text-neutral-600">
          No ordered products yet. Once customers place orders, your
          best-selling items by quantity will appear here.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 text-left">
          {items.map((item) => {
            const editHref = `/dashboard/products/${item.productId}/edit`;
            return (
              <article
                key={item.productId}
                className="rounded-xl border border-neutral-200 p-3"
              >
                <Link
                  href={editHref}
                  className="block rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
                >
                  <div className="flex h-28 w-full items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 p-2">
                    {item.imagePath ? (
                      // eslint-disable-next-line @next/next/no-img-element -- admin thumbnails; local paths, no LCP budget
                      <img
                        src={item.imagePath}
                        alt=""
                        className="max-h-full max-w-full object-contain object-center"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs font-semibold uppercase text-neutral-400">
                        No image
                      </div>
                    )}
                  </div>
                  <p className="mt-3 truncate text-sm font-semibold text-neutral-900">
                    {item.name}
                  </p>
                  <p className="truncate text-sm text-neutral-500">
                    {item.subtitle}
                  </p>
                  <p className="mt-1 text-xs tabular-nums text-neutral-500">
                    {item.unitsOrdered.toLocaleString()} units ordered
                  </p>
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
