import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/store/product-card";
import { STORE_PRODUCT_LISTING_GRID_CLASS } from "@/components/store/product-lazy-grid";
import { SITE_ROUTES, STORE_SHELL } from "@/lib/config/site-config";
import { getStorefrontHeroSlidePage } from "@/lib/hero/storefront-data";

type BannerSlidePageProps = {
  params: Promise<{ slideId: string }>;
};

const sanitizeSlideId = (raw: string): string => raw.trim().slice(0, 40);

export const generateMetadata = async ({
  params,
}: BannerSlidePageProps): Promise<Metadata> => {
  const { slideId } = await params;
  const data = await getStorefrontHeroSlidePage(sanitizeSlideId(slideId));
  if (!data) {
    return { title: "Banner not found" };
  }
  return {
    title: data.name,
    description: `Shop products featured in the ${data.name} banner.`,
  };
};

export default async function BannerSlidePage({
  params,
}: BannerSlidePageProps) {
  const { slideId } = await params;
  const data = await getStorefrontHeroSlidePage(sanitizeSlideId(slideId));
  if (!data) notFound();

  return (
    <main
      className={`flex flex-1 flex-col gap-6 py-6 md:gap-8 md:py-10 ${STORE_SHELL}`}
    >
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
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="truncate text-neutral-700">{data.name}</li>
        </ol>
      </nav>

      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
          {data.name}
        </h1>
        <p className="text-sm text-neutral-600 sm:text-base">
          {data.items.length === 1
            ? "Featured product"
            : `Featured products (${data.items.length})`}
        </p>
      </header>

      <section>
        <ul className={STORE_PRODUCT_LISTING_GRID_CLASS}>
          {data.items.map((product, idx) => (
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
    </main>
  );
}
