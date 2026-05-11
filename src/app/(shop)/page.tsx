import type { Metadata } from "next";
import { HeroBanner } from "@/components/store/hero-banner";
import { HomeProductRails } from "@/components/store/home-product-rails";
import {
  SITE_META_DESCRIPTION,
  STORE_BUSINESS_NAME,
} from "@/lib/config/site-config";
import { listStorefrontHeroSlides } from "@/lib/hero/storefront-data";

export const metadata: Metadata = {
  title: `Home | ${STORE_BUSINESS_NAME}`,
  description: SITE_META_DESCRIPTION,
};

export default async function HomePage() {
  const heroSlides = await listStorefrontHeroSlides();

  return (
    <main className="shop-home-main flex flex-1 flex-col">
      <HeroBanner phones={heroSlides} />
      <HomeProductRails />
    </main>
  );
}
