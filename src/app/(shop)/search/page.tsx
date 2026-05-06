import Link from "next/link";
import { ProductCard } from "@/components/store/product-card";
import { STORE_PRODUCT_LISTING_GRID_CLASS } from "@/components/store/product-lazy-grid";
import { Button } from "@/components/ui/button";
import { STORE_SHELL } from "@/lib/config/site-config";
import { searchStorefrontProducts } from "@/lib/products/storefront-data";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string | string[];
  }>;
};

const toSingle = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) return (value[0] ?? "").trim();
  return (value ?? "").trim();
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolved = await searchParams;
  const query = toSingle(resolved.q);

  const hasQuery = query.length > 0;
  const products = hasQuery
    ? await searchStorefrontProducts({ query, take: 24 })
    : [];
  const hasResults = products.length > 0;

  return (
    <main className={`flex flex-1 flex-col gap-6 py-6 md:py-10 ${STORE_SHELL}`}>
      <header>
        <p className="text-sm text-neutral-700 md:text-base">
          {hasQuery
            ? `Showing search results for "${query}"`
            : "Enter a query from the header search box."}
        </p>
      </header>

      {hasQuery && !hasResults ? (
        <section className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-12 text-center">
          <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">
            No products found
          </h2>
          <p className="max-w-md text-sm text-neutral-600">
            No matches found across your search.
          </p>
          <Link href="/products" className="mt-1 inline-flex">
            <Button type="button" variant="primary" size="md">
              Browse all products
            </Button>
          </Link>
        </section>
      ) : null}

      {products.length ? (
        <section>
          <ul className={STORE_PRODUCT_LISTING_GRID_CLASS}>
            {products.map((product, idx) => (
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
        </section>
      ) : null}
    </main>
  );
}
