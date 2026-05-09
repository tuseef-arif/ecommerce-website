import Link from "next/link";
import { notFound } from "next/navigation";
import { updateDiscountAction } from "@/app/(admin)/dashboard/discounts/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DiscountForm } from "@/components/admin/discount-form";
import { getAdminDiscountById } from "@/lib/discounts/admin-data";

type EditDiscountPageProps = {
  params: Promise<{ discountId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  title: "Edit discount · Admin",
};

export default async function EditDiscountPage({
  params,
  searchParams,
}: EditDiscountPageProps) {
  const { discountId } = await params;
  const resolvedSearchParams = await searchParams;
  const listParams = new URLSearchParams();
  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (key === "status") continue;
    if (Array.isArray(value)) {
      const first = value[0];
      if (typeof first === "string" && first.length > 0)
        listParams.set(key, first);
      continue;
    }
    if (typeof value === "string" && value.length > 0)
      listParams.set(key, value);
  }
  const returnTo =
    listParams.toString().length > 0
      ? `/dashboard/discounts?${listParams.toString()}`
      : "/dashboard/discounts";

  const discount = await getAdminDiscountById(discountId);
  if (!discount) notFound();

  return (
    <>
      <AdminPageHeader
        title={`Edit · ${discount.name}`}
        description="Update discount rules, dates, and visibility."
        actions={
          <Link
            href={returnTo}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-transparent bg-[var(--store-brand-primary)] px-4 text-sm font-semibold text-white shadow-sm transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
          >
            Back to discounts
          </Link>
        }
      />

      <DiscountForm
        mode="edit"
        action={updateDiscountAction}
        initialDiscount={discount}
        cancelHref={returnTo}
        returnTo={returnTo}
      />
    </>
  );
}
