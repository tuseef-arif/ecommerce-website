import type { Metadata } from "next";
import {
  SITE_HOME_PAGE,
  SITE_META_DESCRIPTION,
  STORE_BUSINESS_NAME,
  STORE_SHELL,
} from "@/lib/config/site-config";

export const metadata: Metadata = {
  title: `Home | ${STORE_BUSINESS_NAME}`,
  description: SITE_META_DESCRIPTION,
};

export default function HomePage() {
  return (
    <main
      className={`shop-home-main flex flex-1 flex-col gap-6 py-16 ${STORE_SHELL}`}
    >
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold text-neutral-900">
          {SITE_HOME_PAGE.heading}
        </h1>
        <p className="shop-home-main__lead text-sm">{SITE_HOME_PAGE.lead}</p>
      </section>
    </main>
  );
}
