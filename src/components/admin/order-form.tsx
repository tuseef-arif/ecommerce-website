"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  initialOrderFormState,
  type OrderFormState,
} from "@/app/(admin)/dashboard/orders/form-state";
import { OrderItemsEditor } from "@/components/admin/order-items-editor";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { Button } from "@/components/ui/button";
import { FormInputField } from "@/components/ui/form-input-field";
import { SelectField } from "@/components/ui/select-field";
import { SITE_PRODUCT_SLIDER } from "@/lib/config/site-config";
import type {
  AdminOrderCustomerOption,
  AdminOrderDetail,
  AdminOrderProductOption,
} from "@/lib/orders/admin-types";
import type { OrderStatus } from "@/generated/prisma/enums";

type OrderFormMode = "create" | "edit";

type OrderFormAction = (
  prevState: OrderFormState,
  formData: FormData,
) => Promise<OrderFormState> | OrderFormState;

type OrderFormProps = {
  mode: OrderFormMode;
  action: OrderFormAction;
  customers?: ReadonlyArray<AdminOrderCustomerOption>;
  products?: ReadonlyArray<AdminOrderProductOption>;
  initialOrder?: AdminOrderDetail;
};

const cancelHref = "/dashboard/orders";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
] as const;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

const formatDateTime = (iso: string | null): string => {
  if (!iso) return "—";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "—";
  return dateFormatter.format(parsed);
};

const getStatusDateLine = (order: AdminOrderDetail): string => {
  const statusToLabel: Record<OrderStatus, string> = {
    PENDING: "Placed",
    CONFIRMED: "Confirmed",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
  };

  const statusToDateIso: Record<OrderStatus, string | null> = {
    PENDING: order.createdAtIso,
    CONFIRMED: order.updatedAtIso,
    SHIPPED: order.shippedAtIso ?? order.updatedAtIso,
    DELIVERED: order.deliveredAtIso ?? order.updatedAtIso,
  };

  const label = statusToLabel[order.status];
  const formattedDate = formatDateTime(statusToDateIso[order.status]);
  return `${label} ${formattedDate}`;
};

export const OrderForm = ({
  mode,
  action,
  customers,
  products,
  initialOrder,
}: OrderFormProps) => {
  const [state, formAction, isPending] = useActionState<
    OrderFormState,
    FormData
  >(action, initialOrderFormState);

  const submitLabel = mode === "create" ? "Create order" : "Save";
  const pendingLabel = mode === "create" ? "Creating…" : "Saving…";
  const currencyPrefix = SITE_PRODUCT_SLIDER.pricePrefix;

  const customerOptions = (customers ?? []).map((customer) => ({
    value: customer.id,
    label: `${customer.displayName} · ${customer.email}`,
  }));
  const editInitialItems =
    mode === "edit" && initialOrder
      ? initialOrder.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          selectedColor: item.selectedColor,
          selectedStorage: item.selectedStorage,
        }))
      : [];
  const editStockAllowanceByProductId =
    mode === "edit" && initialOrder
      ? initialOrder.items.reduce<Record<string, number>>((acc, item) => {
          acc[item.productId] = (acc[item.productId] ?? 0) + item.quantity;
          return acc;
        }, {})
      : undefined;

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
      noValidate
    >
      {mode === "edit" && initialOrder ? (
        <input type="hidden" name="orderId" value={initialOrder.id} />
      ) : null}

      {state.errorMessage ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.errorMessage}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          {mode === "edit" && initialOrder ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-mono text-lg font-semibold text-neutral-900">
                  #{initialOrder.shortId}
                </h2>
                <OrderStatusBadge status={initialOrder.status} />
              </div>
              <p className="text-sm text-neutral-600">
                {initialOrder.customer.displayName}{" "}
                <span className="text-neutral-400">·</span>{" "}
                {initialOrder.customer.email}
              </p>
              <p className="text-xs text-neutral-500">
                {getStatusDateLine(initialOrder)}
              </p>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-neutral-900">
                Order details
              </h2>
              <p className="text-sm text-neutral-500">
                Pick a customer, add products, and choose a starting status.
              </p>
            </>
          )}
        </div>
      </div>

      {mode === "create" && products ? (
        <OrderItemsEditor
          products={products}
          currencyPrefix={currencyPrefix}
          errorMessage={state.fieldErrors.items ?? null}
          leadFields={
            <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,2fr)]">
              <SelectField
                label="Customer"
                name="userId"
                variant="floating"
                size="sm"
                options={customerOptions}
                placeholder={
                  customerOptions.length === 0
                    ? "No customers available"
                    : "Select a customer"
                }
                required
                error={state.fieldErrors.userId ?? null}
              />
              <SelectField
                label="Status"
                name="status"
                variant="floating"
                size="sm"
                options={STATUS_OPTIONS}
                defaultValue="PENDING"
                error={state.fieldErrors.status ?? null}
              />
              <div className="hidden min-h-[2.5rem] lg:block" aria-hidden />
            </div>
          }
        />
      ) : null}

      {mode === "edit" && initialOrder && products ? (
        <OrderItemsEditor
          products={products}
          currencyPrefix={currencyPrefix}
          errorMessage={state.fieldErrors.items ?? null}
          initialItems={editInitialItems}
          stockAllowanceByProductId={editStockAllowanceByProductId}
          leadFields={
            <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,2fr)]">
              <FormInputField
                label="Customer"
                name="customerDisplay"
                readOnly
                value={`${initialOrder.customer.displayName} · ${initialOrder.customer.email}`}
                inputClassName="peer h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 pb-1 pt-3 text-sm leading-5 text-neutral-900 outline-none ring-0 transition-colors placeholder:text-transparent focus:border-[var(--store-brand-primary)] focus:ring-0"
                labelClassName="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 bg-white px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500 transition-all duration-150 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[10px] peer-focus:text-[var(--store-brand-primary)] peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-neutral-600"
              />
              <SelectField
                label="Status"
                name="status"
                variant="floating"
                size="sm"
                options={STATUS_OPTIONS}
                defaultValue={initialOrder.status}
                error={state.fieldErrors.status ?? null}
              />
              <div className="hidden min-h-[2.5rem] lg:block" aria-hidden />
            </div>
          }
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-neutral-200 pt-4">
        <Button
          type="submit"
          variant="primary"
          isLoading={isPending}
          loadingLabel={pendingLabel}
        >
          {submitLabel}
        </Button>
        <Link
          href={cancelHref}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
};
