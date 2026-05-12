import { CustomerDetailActions } from "@/components/admin/customer-detail-actions";
import type { AdminCustomerDetail } from "@/lib/customers/admin-types";
import { formatInstantForStoreDateTime } from "@/lib/datetime/display-timezone";

type CustomerDetailCardProps = {
  customer: AdminCustomerDetail;
};

const COMPACT_INPUT_CLASS_NAME =
  "h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 pb-1 pt-3 text-sm leading-5 text-neutral-900";
const COMPACT_LABEL_CLASS_NAME =
  "pointer-events-none absolute left-2.5 top-0 -translate-y-1/2 bg-white px-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-600";

const formatDateTime = (iso: string): string =>
  formatInstantForStoreDateTime(iso);

const displayOrDash = (value: string): string => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "—";
};

const ReadOnlyField = ({ label, value }: { label: string; value: string }) => (
  <label className="relative block">
    <input
      readOnly
      tabIndex={-1}
      value={value}
      className={COMPACT_INPUT_CLASS_NAME}
      aria-label={label}
    />
    <span className={COMPACT_LABEL_CLASS_NAME}>{label}</span>
  </label>
);

export const CustomerDetailCard = ({ customer }: CustomerDetailCardProps) => {
  return (
    <section className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="min-w-0">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-neutral-900">
            {customer.email}
          </h2>
          <p className="text-sm text-neutral-500">
            {customer.ordersCount} order{customer.ordersCount === 1 ? "" : "s"}{" "}
            on file.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ReadOnlyField
          label="First name"
          value={displayOrDash(customer.firstName)}
        />
        <ReadOnlyField
          label="Last name"
          value={displayOrDash(customer.lastName)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ReadOnlyField label="Email" value={customer.email} />
        <ReadOnlyField label="Phone" value={displayOrDash(customer.phone)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ReadOnlyField
          label="Role"
          value={customer.role === "ADMIN" ? "Admin" : "User"}
        />
        <ReadOnlyField
          label="Status"
          value={customer.status === "ACTIVE" ? "Active" : "Inactive"}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ReadOnlyField
          label="Created date"
          value={formatDateTime(customer.createdAtIso)}
        />
        <ReadOnlyField
          label="Modified date"
          value={formatDateTime(customer.updatedAtIso)}
        />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-neutral-200 pt-4">
        <CustomerDetailActions
          customerId={customer.id}
          customerName={customer.email}
        />
      </div>
    </section>
  );
};
