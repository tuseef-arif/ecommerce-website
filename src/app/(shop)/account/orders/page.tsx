import type { Metadata } from "next";
import { AccountOrdersList } from "@/components/store/account-orders-list";
import { requireUser } from "@/lib/auth-guards";
import {
  STORE_BUSINESS_NAME,
  STORE_PHONE_DISPLAY,
  STORE_PHONE_TEL,
  STORE_SHELL,
  STORE_SITE_FOOTER_DOM_ID,
  STORE_SOCIAL_WHATSAPP,
} from "@/lib/config/site-config";
import { listAccountOrdersForUser } from "@/lib/orders/account-orders";

const ctaBase =
  "inline-flex min-h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold shadow-sm transition-[filter,background-color] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:px-4";

const contactScrollClass = `${ctaBase} border border-transparent bg-[var(--store-brand-accent)] text-white hover:brightness-110 focus-visible:outline-[var(--store-brand-accent)]`;

const whatsappClass = `${ctaBase} border border-transparent bg-[var(--store-brand-primary)] text-white hover:brightness-110 focus-visible:outline-[var(--store-brand-primary)]`;

export const metadata: Metadata = {
  title: `Your orders | ${STORE_BUSINESS_NAME}`,
  description: `View order history at ${STORE_BUSINESS_NAME}.`,
};

export default async function AccountOrdersPage() {
  const user = await requireUser();
  const orders = await listAccountOrdersForUser(user.id);
  const footerHash = `#${STORE_SITE_FOOTER_DOM_ID}`;
  const hasWhatsApp = STORE_SOCIAL_WHATSAPP.trim().length > 0;

  return (
    <main className={`flex-1 py-8 sm:py-10 ${STORE_SHELL}`}>
      <header className="mb-7 flex items-end justify-between gap-3 sm:mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Your orders
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            {orders.length === 0
              ? "When you place an order, it will show up here."
              : `${orders.length} ${orders.length === 1 ? "order" : "orders"} on your account.`}
          </p>
        </div>
      </header>

      {orders.length === 0 ? (
        <AccountOrdersList orders={orders} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
          <AccountOrdersList orders={orders} />
          <aside className="h-fit rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <div className="border-b border-neutral-200 pb-4">
              <h2 className="text-lg font-semibold text-neutral-900">
                Order help
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                Questions about delivery or payment? Reach out anytime.
              </p>
            </div>
            <div className="space-y-4 py-4 text-sm text-neutral-700">
              {STORE_PHONE_DISPLAY ? (
                <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="shrink-0 font-medium text-neutral-900">
                    Phone
                  </span>
                  {STORE_PHONE_TEL ? (
                    <a
                      href={STORE_PHONE_TEL}
                      className="min-w-0 text-[var(--store-brand-primary)] hover:underline"
                    >
                      {STORE_PHONE_DISPLAY}
                    </a>
                  ) : (
                    <span className="min-w-0">{STORE_PHONE_DISPLAY}</span>
                  )}
                </p>
              ) : (
                <p className="text-neutral-600">
                  Full contact details are in the site footer below.
                </p>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <a href={footerHash} className={contactScrollClass}>
                  Contact us
                </a>
                {hasWhatsApp ? (
                  <a
                    href={STORE_SOCIAL_WHATSAPP}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={whatsappClass}
                  >
                    WhatsApp us
                  </a>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
