import Link from "next/link";
import { FormInputField } from "@/components/ui/form-input-field";
import { SelectField } from "@/components/ui/select-field";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/orders/payment-method";
import type { AdminOrdersListFilters } from "@/lib/orders/admin-types";

type OrderFiltersProps = {
  filters: AdminOrdersListFilters;
};

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

const PAYMENT_FILTER_OPTIONS = [
  { value: "all", label: "All payments" },
  ...PAYMENT_METHOD_OPTIONS,
] as const;

const COMPACT_INPUT_CLASS_NAME =
  "peer h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 pb-1 pt-3 text-sm leading-5 text-neutral-900 outline-none ring-0 transition-colors placeholder:text-transparent focus:border-[var(--store-brand-primary)] focus:ring-0";
const COMPACT_LABEL_CLASS_NAME =
  "pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 bg-white px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500 transition-all duration-150 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[10px] peer-focus:text-[var(--store-brand-primary)] peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-neutral-600";

const FLOATING_DATE_INPUT_CLASS_NAME =
  "peer h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 pb-1 pt-3 text-sm leading-5 text-neutral-900 outline-none ring-0 transition-colors focus:border-[var(--store-brand-primary)] focus:ring-0";
const FLOATING_DATE_LABEL_CLASS_NAME =
  "pointer-events-none absolute left-2.5 top-0 -translate-y-1/2 bg-white px-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-600";

export const OrderFilters = ({ filters }: OrderFiltersProps) => {
  return (
    <form
      method="get"
      action="/dashboard/orders"
      className="grid gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]"
    >
      <FormInputField
        id="order-search"
        label="Search"
        name="q"
        type="search"
        defaultValue={filters.q}
        placeholder="Customer email, name, or order id"
        autoComplete="off"
        inputClassName={COMPACT_INPUT_CLASS_NAME}
        labelClassName={COMPACT_LABEL_CLASS_NAME}
      />

      <SelectField
        label="Status"
        name="status"
        options={STATUS_OPTIONS}
        defaultValue={filters.status}
        variant="floating"
        size="sm"
      />

      <SelectField
        label="Payment"
        name="paymentMethod"
        options={PAYMENT_FILTER_OPTIONS}
        defaultValue={filters.paymentMethod}
        variant="floating"
        size="sm"
      />

      <FormInputField
        label="From"
        name="from"
        type="date"
        defaultValue={filters.from}
        inputClassName={FLOATING_DATE_INPUT_CLASS_NAME}
        labelClassName={FLOATING_DATE_LABEL_CLASS_NAME}
      />
      <FormInputField
        label="To"
        name="to"
        type="date"
        defaultValue={filters.to}
        inputClassName={FLOATING_DATE_INPUT_CLASS_NAME}
        labelClassName={FLOATING_DATE_LABEL_CLASS_NAME}
      />

      <div className="flex h-10 items-stretch gap-2 self-end">
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--store-brand-primary)] px-4 text-sm font-semibold text-white shadow-sm transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
        >
          Apply
        </button>
        <Link
          href="/dashboard/orders"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          Reset
        </Link>
      </div>
    </form>
  );
};
