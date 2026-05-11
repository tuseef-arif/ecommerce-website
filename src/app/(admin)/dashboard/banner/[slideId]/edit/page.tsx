import Link from "next/link";
import { notFound } from "next/navigation";
import { updateHeroSlideAction } from "@/app/(admin)/dashboard/banner/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { HeroSlideForm } from "@/components/admin/hero-slide-form";
import { getAdminHeroSlideById } from "@/lib/hero/admin-data";

type EditHeroSlidePageProps = {
  params: Promise<{ slideId: string }>;
};

export const metadata = {
  title: "Edit hero slide · Admin",
};

export default async function EditHeroSlidePage({
  params,
}: EditHeroSlidePageProps) {
  const { slideId } = await params;
  const slide = await getAdminHeroSlideById(slideId);
  if (!slide) notFound();

  return (
    <>
      <AdminPageHeader
        title={`Edit · ${slide.name}`}
        description="Update the slide image, copy, and visibility."
        actions={
          <Link
            href="/dashboard/banner"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-transparent bg-[var(--store-brand-primary)] px-4 text-sm font-semibold text-white shadow-sm transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
          >
            Back to banners
          </Link>
        }
      />

      <HeroSlideForm
        mode="edit"
        action={updateHeroSlideAction}
        initialSlide={slide}
        cancelHref="/dashboard/banner"
      />
    </>
  );
}
