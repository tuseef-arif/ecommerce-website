import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requireAdmin } from "@/lib/auth-guards";

const metricCards = [
  { label: "Total Revenue", value: "Rs 0.00", trend: "+0.0%" },
  { label: "Total Orders", value: "0", trend: "+0.0%" },
  { label: "Total Customers", value: "0", trend: "+0.0%" },
  { label: "Pending Delivery", value: "0", trend: "+0.0%" },
] as const;

export default async function DashboardPage() {
  const user = await requireAdmin();

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description={`Welcome back, ${user.email}. This UI is design-only for now.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <article
            key={card.label}
            className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <p className="text-sm text-neutral-500">{card.label}</p>
            <p className="mt-3 text-3xl font-bold text-neutral-900">
              {card.value}
            </p>
            <p className="mt-2 text-sm font-semibold text-emerald-600">
              {card.trend}
            </p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-neutral-900">
              Sales analytics
            </h2>
            <select className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700">
              <option>Last 30 days</option>
            </select>
          </div>
          <div className="h-52 rounded-xl border border-dashed border-neutral-300 bg-gradient-to-b from-[rgb(42_75_160_/_0.08)] to-[rgb(254_153_34_/_0.08)]" />
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-neutral-900">Current offer</h2>
          <div className="mt-4 space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-semibold text-neutral-800">
                  Flash discount
                </span>
                <span className="text-neutral-500">40%</span>
              </div>
              <div className="h-2 rounded-full bg-neutral-200">
                <div className="h-2 w-2/3 rounded-full bg-[var(--store-brand-accent)]" />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-semibold text-neutral-800">
                  Stock movement
                </span>
                <span className="text-neutral-500">58%</span>
              </div>
              <div className="h-2 rounded-full bg-neutral-200">
                <div className="h-2 w-1/2 rounded-full bg-[var(--store-brand-primary)]" />
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900">Top products</h2>
          <button
            type="button"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            View all
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <article
              key={`placeholder-product-${index}`}
              className="rounded-xl border border-neutral-200 p-3"
            >
              <div className="h-28 rounded-lg bg-neutral-100" />
              <p className="mt-3 text-sm font-semibold text-neutral-900">
                Product name
              </p>
              <p className="text-sm text-neutral-500">Brand / Type</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
