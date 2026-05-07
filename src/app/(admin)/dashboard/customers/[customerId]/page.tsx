import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CustomerDetailCard } from "@/components/admin/customer-detail-card";
import { getAdminCustomerById } from "@/lib/customers/admin-data";
import { composeCustomerDisplayName } from "@/lib/customers/display";

type CustomerDetailPageProps = {
  params: Promise<{ customerId: string }>;
};

export const metadata = {
  title: "Customer details · Admin",
};

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
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
        title={`Customer · ${displayName}`}
        description="View customer information and switch to edit mode when needed."
        actions={
          <Link
            href="/dashboard/customers"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-transparent bg-[var(--store-brand-primary)] px-4 text-sm font-semibold text-white shadow-sm transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
          >
            Back to customers
          </Link>
        }
      />

      <CustomerDetailCard customer={customer} />
    </>
  );
}
