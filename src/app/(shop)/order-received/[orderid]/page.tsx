import { notFound } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { SITE_PRODUCT_SLIDER, STORE_SHELL } from "@/lib/config/site-config";
import {
  paymentMethodDescription,
  paymentMethodLabel,
} from "@/lib/orders/payment-method";
import { formatProductPriceWithPrefix } from "@/lib/products/format-price";

type OrderReceivedPageProps = {
  params: Promise<{ orderid: string }>;
};

const displayOrDash = (value: string | null | undefined): string => {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : "—";
};

const orderIdSchema = z.string().cuid();

export default async function OrderReceivedPage({
  params,
}: OrderReceivedPageProps) {
  const { orderid } = await params;
  if (!orderIdSchema.safeParse(orderid).success) notFound();

  const order = await prisma.order.findUnique({
    where: { id: orderid },
    select: {
      id: true,
      createdAt: true,
      paymentMethod: true,
      subtotal: true,
      discountAmount: true,
      totalAmount: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          country: true,
        },
      },
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          productName: true,
          quantity: true,
          lineTotal: true,
        },
      },
    },
  });

  if (!order) notFound();

  const shippingLabel = "Free";
  const orderDate = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(order.createdAt);
  const orderNumber = order.id.slice(-8).toUpperCase();
  const fullName =
    `${order.user.firstName ?? ""} ${order.user.lastName ?? ""}`.trim() || "—";
  const paymentLabel = paymentMethodLabel(order.paymentMethod);
  const paymentBlurb = paymentMethodDescription(order.paymentMethod);

  return (
    <main className={`flex-1 py-8 sm:py-10 ${STORE_SHELL}`}>
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <h1 className="text-center text-2xl font-bold text-neutral-900 sm:text-3xl">
          <span className="block">Thank you.</span>
          <span className="block">Your order has been received.</span>
        </h1>

        <div className="mt-6 grid grid-cols-2 gap-3 border-y border-neutral-200 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Order Number
            </p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              {orderNumber}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Order Date
            </p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              {orderDate}
            </p>
          </div>
        </div>

        <p className="mt-5 text-sm text-neutral-700">{paymentBlurb}</p>

        <h2 className="mt-8 text-2xl font-bold tracking-tight text-neutral-900">
          Order Details
        </h2>

        <div className="mt-4 overflow-hidden rounded-xl border border-neutral-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-neutral-700">
                  Product
                </th>
                <th className="px-4 py-3 font-semibold text-neutral-700">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-t border-neutral-200">
                  <td className="px-4 py-3 text-neutral-700">
                    {item.productName} x {item.quantity}
                  </td>
                  <td className="px-4 py-3 font-semibold text-neutral-900">
                    {formatProductPriceWithPrefix(
                      Number(item.lineTotal),
                      SITE_PRODUCT_SLIDER.pricePrefix,
                    )}
                  </td>
                </tr>
              ))}
              <tr className="border-t border-neutral-200">
                <td className="px-4 py-3 font-semibold text-neutral-700">
                  Subtotal:
                </td>
                <td className="px-4 py-3 font-semibold text-neutral-900">
                  {formatProductPriceWithPrefix(
                    Number(order.subtotal),
                    SITE_PRODUCT_SLIDER.pricePrefix,
                  )}
                </td>
              </tr>
              <tr className="border-t border-neutral-200">
                <td className="px-4 py-3 font-semibold text-neutral-700">
                  Discount:
                </td>
                <td className="px-4 py-3 font-semibold text-emerald-700">
                  -{" "}
                  {formatProductPriceWithPrefix(
                    Number(order.discountAmount),
                    SITE_PRODUCT_SLIDER.pricePrefix,
                  )}
                </td>
              </tr>
              <tr className="border-t border-neutral-200">
                <td className="px-4 py-3 font-semibold text-neutral-700">
                  Shipping:
                </td>
                <td className="px-4 py-3 font-semibold text-neutral-900">
                  {shippingLabel}
                </td>
              </tr>
              <tr className="border-t border-neutral-200">
                <td className="px-4 py-3 font-semibold text-neutral-700">
                  Order Total:
                </td>
                <td className="px-4 py-3 text-lg font-bold text-[var(--store-brand-primary)]">
                  {formatProductPriceWithPrefix(
                    Number(order.totalAmount),
                    SITE_PRODUCT_SLIDER.pricePrefix,
                  )}
                </td>
              </tr>
              <tr className="border-t border-neutral-200">
                <td className="px-4 py-3 font-semibold text-neutral-700">
                  Payment Method:
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-neutral-900">
                  {paymentLabel}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-8">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <h3 className="text-lg font-semibold text-neutral-900">
              Shipping Details
            </h3>
            <div className="mt-3 space-y-1 text-sm text-neutral-700">
              <p>{fullName}</p>
              <p>{displayOrDash(order.user.address)}</p>
              <p>
                {displayOrDash(order.user.city)},{" "}
                {displayOrDash(order.user.country)}
              </p>
              <p>{displayOrDash(order.user.phone)}</p>
              <p>{displayOrDash(order.user.email)}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
