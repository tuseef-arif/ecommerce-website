import { ProductSlider } from "@/components/store/product-slider";
import { SITE_HOME_PRODUCT_RAILS, STORE_SHELL } from "@/lib/config/site-config";
import { listFeaturedProductsByCategorySlug } from "@/lib/products/storefront-data";

/**
 * Server Component: fetches configured rails in parallel and renders one
 * `ProductSlider` per entry under the hero banner. Empty rails still render
 * their built-in empty state, so a missing category never blanks the page.
 */
export const HomeProductRails = async () => {
  const rails = await Promise.all(
    SITE_HOME_PRODUCT_RAILS.map(async (rail) => ({
      rail,
      products: await listFeaturedProductsByCategorySlug(rail.categorySlug),
    })),
  );

  return (
    <section
      aria-label="Featured product rails"
      className={`flex flex-col gap-8 py-8 md:gap-10 md:py-10 ${STORE_SHELL}`}
    >
      {rails.map(({ rail, products }, idx) => (
        <ProductSlider
          key={rail.categorySlug}
          title={rail.title}
          ariaLabel={rail.title}
          viewAllHref={rail.viewAllHref}
          products={products}
          prioritizeFirstImage={idx === 0}
        />
      ))}
    </section>
  );
};
