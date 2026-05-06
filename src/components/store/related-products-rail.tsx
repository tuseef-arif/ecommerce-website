import { ProductSlider } from "@/components/store/product-slider";
import { SITE_PRODUCT_DETAIL } from "@/lib/config/site-config";
import { listFeaturedProductsByCategorySlug } from "@/lib/products/storefront-data";

type RelatedProductsRailProps = {
  /** Category slug of the currently-viewed product (drives the rail). */
  categorySlug: string;
  /** Display name of the category — interpolated into the heading. */
  categoryName: string;
  /** Current product id — excluded from the rail so the user doesn't see themselves. */
  excludeProductId: string;
};

/**
 * Single-rail wrapper around `ProductSlider` for the product detail page.
 * Reuses the same data fetcher as the home rails with `excludeProductId` set
 * so the current product never appears among its own "related" items.
 *
 * Returns `null` when the category has no other in-stock products — keeps
 * the page tidy instead of rendering an empty placeholder.
 */
export const RelatedProductsRail = async ({
  categorySlug,
  categoryName,
  excludeProductId,
}: RelatedProductsRailProps) => {
  const products = await listFeaturedProductsByCategorySlug(categorySlug, {
    excludeProductId,
  });

  if (products.length === 0) return null;

  const heading = SITE_PRODUCT_DETAIL.relatedHeading.replace(
    "{category}",
    categoryName,
  );

  return (
    <ProductSlider
      title={heading}
      ariaLabel={heading}
      products={products}
      viewAllHref={`/products?category=${categorySlug}`}
      viewAllLabel={SITE_PRODUCT_DETAIL.relatedViewAllLabel}
    />
  );
};
