import Link from "next/link";
import { createDiscountAction } from "@/app/(admin)/dashboard/discounts/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DiscountForm } from "@/components/admin/discount-form";

export const metadata = {
  title: "Create discount · Admin",
};

export default function NewDiscountPage() {
  return (
    <>
      <AdminPageHeader
        title="Create discount"
        description="Add a fixed or percentage discount with optional thresholds and caps."
        actions={
          <Link
            href="/dashboard/discounts"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-transparent bg-[var(--store-brand-primary)] px-4 text-sm font-semibold text-white shadow-sm transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
          >
            Back to discounts
          </Link>
        }
      />

      <DiscountForm mode="create" action={createDiscountAction} />
    </>
  );
}
