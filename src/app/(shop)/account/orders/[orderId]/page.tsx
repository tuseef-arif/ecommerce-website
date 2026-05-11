import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AccountOrderDetailView } from "@/components/store/account-order-detail-view";
import { requireUser } from "@/lib/auth-guards";
import {
  SITE_ROUTES,
  STORE_BUSINESS_NAME,
  STORE_SHELL,
} from "@/lib/config/site-config";
import {
  formatStoreOrderNumber,
  getAccountOrderForUser,
} from "@/lib/orders/account-orders";

type AccountOrderDetailPageProps = {
  params: Promise<{ orderId: string }>;
};

const orderIdSchema = z.string().cuid();

export const generateMetadata = async ({
  params,
}: AccountOrderDetailPageProps): Promise<Metadata> => {
  const { orderId } = await params;
  if (!orderIdSchema.safeParse(orderId).success) {
    return { title: `Order | ${STORE_BUSINESS_NAME}` };
  }
  return {
    title: `Order ${formatStoreOrderNumber(orderId)} | ${STORE_BUSINESS_NAME}`,
    description: `View order ${formatStoreOrderNumber(orderId)} at ${STORE_BUSINESS_NAME}.`,
  };
};

export default async function AccountOrderDetailPage({
  params,
}: AccountOrderDetailPageProps) {
  const user = await requireUser();
  const { orderId } = await params;
  if (!orderIdSchema.safeParse(orderId).success) notFound();

  const order = await getAccountOrderForUser(user.id, orderId);
  if (!order) notFound();

  const orderNumber = formatStoreOrderNumber(order.id);

  return (
    <main className={`flex-1 py-8 sm:py-10 ${STORE_SHELL}`}>
      <header className="mb-7 sm:mb-8">
        <p className="text-sm font-medium text-neutral-500">
          <Link
            href={SITE_ROUTES.accountOrders}
            className="text-[var(--store-brand-primary)] hover:underline"
          >
            Your orders
          </Link>
          <span className="mx-1.5 text-neutral-400" aria-hidden>
            /
          </span>
          <span className="text-neutral-700">Order {orderNumber}</span>
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
          Order details
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Read-only summary of what you ordered. To change an order, contact the
          store.
        </p>
      </header>

      <AccountOrderDetailView order={order} />
    </main>
  );
}
