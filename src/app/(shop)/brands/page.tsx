import type { Metadata } from "next";
import Link from "next/link";
import { STORE_BUSINESS_NAME, STORE_SHELL } from "@/lib/config/site-config";

export const metadata: Metadata = {
  title: `Brands | ${STORE_BUSINESS_NAME}`,
  description: `Shop phones and accessories by brand at ${STORE_BUSINESS_NAME}.`,
};

export default function BrandsPage() {
  return (
    <main className={`flex flex-1 flex-col gap-4 py-10 ${STORE_SHELL}`}>
      <h1 className="text-2xl font-semibold text-neutral-900">Brands</h1>
      <p className="text-sm text-neutral-600">
        Brand listings will appear here — use categories to browse devices for
        now.
      </p>
      <Link
        href="/categories"
        className="text-sm font-semibold text-[var(--store-brand-primary)] underline-offset-4 hover:underline"
      >
        Browse categories
      </Link>
    </main>
  );
}
