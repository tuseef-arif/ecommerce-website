import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/store/product-detail";
import { RelatedProductsRail } from "@/components/store/related-products-rail";
import {
  SITE_PRODUCT_DETAIL,
  STORE_BUSINESS_NAME,
  STORE_SHELL,
} from "@/lib/config/site-config";
import { getStorefrontProductBySlug } from "@/lib/products/storefront-data";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

const META_DESCRIPTION_MAX = 160;

const buildMetaDescription = (description: string | null): string => {
  if (!description) return SITE_PRODUCT_DETAIL.metaDescriptionFallback;
  const collapsed = description.replace(/\s+/g, " ").trim();
  if (collapsed.length === 0) {
    return SITE_PRODUCT_DETAIL.metaDescriptionFallback;
  }
  if (collapsed.length <= META_DESCRIPTION_MAX) return collapsed;
  return `${collapsed.slice(0, META_DESCRIPTION_MAX - 1).trimEnd()}…`;
};

export const generateMetadata = async ({
  params,
}: ProductPageProps): Promise<Metadata> => {
  const { slug } = await params;
  const product = await getStorefrontProductBySlug(slug);
  if (!product) {
    return {
      title: `${SITE_PRODUCT_DETAIL.notFoundTitle} | ${STORE_BUSINESS_NAME}`,
      description: SITE_PRODUCT_DETAIL.metaDescriptionFallback,
    };
  }
  return {
    title: `${product.name} | ${STORE_BUSINESS_NAME}`,
    description: buildMetaDescription(product.description),
  };
};

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const product = await getStorefrontProductBySlug(slug);
  if (!product) notFound();

  return (
    <main
      className={`flex flex-1 flex-col gap-10 py-8 md:py-10 ${STORE_SHELL}`}
    >
      <ProductDetail product={product} />

      <RelatedProductsRail
        categorySlug={product.category.slug}
        categoryName={product.category.name}
        excludeProductId={product.id}
      />
    </main>
  );
}
