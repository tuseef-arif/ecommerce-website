import Link from "next/link";
import { notFound } from "next/navigation";
import { updateOrderAction } from "@/app/(admin)/dashboard/orders/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OrderForm } from "@/components/admin/order-form";
import { OrderListStatusBanner } from "@/components/admin/order-list-status-banner";
import {
  getAdminOrderById,
  listAdminOrderProductOptions,
} from "@/lib/orders/admin-data";
import { parseAdminOrdersListStatus } from "@/lib/orders/filters";

type EditOrderPageProps = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  title: "Edit order · Admin",
};

export default async function EditOrderPage({
  params,
  searchParams,
}: EditOrderPageProps) {
  const [{ orderId }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  const [order, products] = await Promise.all([
    getAdminOrderById(orderId),
    listAdminOrderProductOptions(),
  ]);
  if (!order) notFound();

  const status = parseAdminOrdersListStatus(resolvedSearchParams.status);

  return (
    <>
      <AdminPageHeader
        title={`Order · #${order.shortId}`}
        description="Update order status and line items for this order."
        actions={
          <Link
            href="/dashboard/orders"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-transparent bg-[var(--store-brand-primary)] px-4 text-sm font-semibold text-white shadow-sm transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
          >
            Back to orders
          </Link>
        }
      />

      <OrderListStatusBanner status={status} />

      <OrderForm
        mode="edit"
        action={updateOrderAction}
        initialOrder={order}
        products={products}
      />
    </>
  );
}
