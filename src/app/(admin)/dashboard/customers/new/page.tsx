import Link from "next/link";
import { createCustomerAction } from "@/app/(admin)/dashboard/customers/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CustomerForm } from "@/components/admin/customer-form";

export const metadata = {
  title: "Create customer · Admin",
};

export default async function NewCustomerPage() {
  return (
    <>
      <AdminPageHeader
        title="Create customer"
        description="Add a new customer or admin to the platform."
        actions={
          <Link
            href="/dashboard/customers"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-transparent bg-[var(--store-brand-primary)] px-4 text-sm font-semibold text-white shadow-sm transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
          >
            Back to customers
          </Link>
        }
      />

      <CustomerForm mode="create" action={createCustomerAction} />
    </>
  );
}
