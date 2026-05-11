import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { HeroSlideListStatusBanner } from "@/components/admin/hero-slide-list-status-banner";
import { HeroSlideTable } from "@/components/admin/hero-slide-table";
import { listAdminHeroSlides } from "@/lib/hero/admin-data";
import type { AdminHeroSlidesListStatus } from "@/lib/hero/admin-types";

type DashboardBannerPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  title: "Hero banner · Admin",
};

const parseStatus = (
  raw: string | string[] | undefined,
): AdminHeroSlidesListStatus => {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "created" || value === "updated" || value === "deleted") {
    return value;
  }
  return null;
};

export default async function DashboardBannerPage({
  searchParams,
}: DashboardBannerPageProps) {
  const resolvedSearchParams = await searchParams;
  const status = parseStatus(resolvedSearchParams.status);

  const slides = await listAdminHeroSlides();

  return (
    <>
      <AdminPageHeader
        title="Hero banner"
        description="Manage the rotating slides shown at the top of the storefront. Lower sort order renders first."
        actions={
          <Link
            href="/dashboard/banner/new"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--store-brand-primary)] px-4 text-sm font-semibold text-white shadow-sm transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
          >
            + Create slide
          </Link>
        }
      />

      <HeroSlideListStatusBanner status={status} />

      <HeroSlideTable items={slides} />
    </>
  );
}
