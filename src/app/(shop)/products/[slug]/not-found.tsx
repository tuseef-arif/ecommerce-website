import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  SITE_PRODUCT_DETAIL,
  SITE_ROUTES,
  STORE_SHELL,
} from "@/lib/config/site-config";

export default function ProductNotFound() {
  return (
    <main
      className={`flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center ${STORE_SHELL}`}
    >
      <h1 className="text-2xl font-semibold text-neutral-900 sm:text-3xl">
        {SITE_PRODUCT_DETAIL.notFoundTitle}
      </h1>
      <p className="max-w-md text-sm text-neutral-600">
        {SITE_PRODUCT_DETAIL.notFoundLead}
      </p>
      <Link href={SITE_ROUTES.home}>
        <Button variant="primary" size="md" className="rounded-full">
          {SITE_PRODUCT_DETAIL.backToHomeCta}
        </Button>
      </Link>
    </main>
  );
}
