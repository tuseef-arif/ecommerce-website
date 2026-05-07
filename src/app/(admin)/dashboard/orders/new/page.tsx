import Link from "next/link";
import { createOrderAction } from "@/app/(admin)/dashboard/orders/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OrderForm } from "@/components/admin/order-form";
import {
  listAdminOrderCustomerOptions,
  listAdminOrderProductOptions,
} from "@/lib/orders/admin-data";

export const metadata = {
  title: "Create order · Admin",
};

export default async function NewOrderPage() {
  const [customers, products] = await Promise.all([
    listAdminOrderCustomerOptions(),
    listAdminOrderProductOptions(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Create order"
        description="Create a new order on behalf of a customer."
        actions={
          <Link
            href="/dashboard/orders"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-transparent bg-[var(--store-brand-primary)] px-4 text-sm font-semibold text-white shadow-sm transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
          >
            Back to orders
          </Link>
        }
      />

      <OrderForm
        mode="create"
        action={createOrderAction}
        customers={customers}
        products={products}
      />
    </>
  );
}
