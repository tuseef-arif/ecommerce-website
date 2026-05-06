import type { Metadata } from "next";
import { HeroBanner } from "@/components/store/hero-banner";
import { HomeProductRails } from "@/components/store/home-product-rails";
import {
  SITE_META_DESCRIPTION,
  STORE_BUSINESS_NAME,
} from "@/lib/config/site-config";

export const metadata: Metadata = {
  title: `Home | ${STORE_BUSINESS_NAME}`,
  description: SITE_META_DESCRIPTION,
};

export default function HomePage() {
  return (
    <main className="shop-home-main flex flex-1 flex-col">
      <HeroBanner />
      <HomeProductRails />
    </main>
  );
}
