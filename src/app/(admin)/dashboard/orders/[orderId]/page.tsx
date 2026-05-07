import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OrderDetailCard } from "@/components/admin/order-detail-card";
import { getAdminOrderById } from "@/lib/orders/admin-data";

type OrderDetailPageProps = {
  params: Promise<{ orderId: string }>;
};

export const metadata = {
  title: "Order details · Admin",
};

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { orderId } = await params;
  const order = await getAdminOrderById(orderId);
  if (!order) notFound();

  return (
    <>
      <AdminPageHeader
        title={`Order · #${order.shortId}`}
        description="View order details, then switch to edit mode when needed."
        actions={
          <Link
            href="/dashboard/orders"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-transparent bg-[var(--store-brand-primary)] px-4 text-sm font-semibold text-white shadow-sm transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
          >
            Back to orders
          </Link>
        }
      />
      <OrderDetailCard order={order} />
    </>
  );
}
