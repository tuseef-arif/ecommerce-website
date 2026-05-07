import Link from "next/link";
import { notFound } from "next/navigation";
import { updateCustomerAction } from "@/app/(admin)/dashboard/customers/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CustomerForm } from "@/components/admin/customer-form";
import { getAdminCustomerById } from "@/lib/customers/admin-data";
import { composeCustomerDisplayName } from "@/lib/customers/display";

type EditCustomerPageProps = {
  params: Promise<{ customerId: string }>;
};

export const metadata = {
  title: "Edit customer · Admin",
};

export default async function EditCustomerPage({
  params,
}: EditCustomerPageProps) {
  const { customerId } = await params;

  const customer = await getAdminCustomerById(customerId);
  if (!customer) notFound();

  const displayName = composeCustomerDisplayName({
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
  });

  return (
    <>
      <AdminPageHeader
        title={`Edit · ${displayName}`}
        description="Update customer details, role, and contact information."
        actions={
          <Link
            href="/dashboard/customers"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-transparent bg-[var(--store-brand-primary)] px-4 text-sm font-semibold text-white shadow-sm transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
          >
            Back to customers
          </Link>
        }
      />

      <CustomerForm
        mode="edit"
        action={updateCustomerAction}
        initialCustomer={customer}
      />
    </>
  );
}
