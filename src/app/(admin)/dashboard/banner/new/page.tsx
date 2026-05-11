import Link from "next/link";
import { createHeroSlideAction } from "@/app/(admin)/dashboard/banner/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { HeroSlideForm } from "@/components/admin/hero-slide-form";

export const metadata = {
  title: "Create hero slide · Admin",
};

export default function NewHeroSlidePage() {
  return (
    <>
      <AdminPageHeader
        title="Create hero slide"
        description="Add a new slide to the storefront hero rotator."
        actions={
          <Link
            href="/dashboard/banner"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-transparent bg-[var(--store-brand-primary)] px-4 text-sm font-semibold text-white shadow-sm transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
          >
            Back to banners
          </Link>
        }
      />

      <HeroSlideForm mode="create" action={createHeroSlideAction} />
    </>
  );
}
