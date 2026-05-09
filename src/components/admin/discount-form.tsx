"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  initialDiscountFormState,
  type DiscountFormState,
} from "@/app/(admin)/dashboard/discounts/form-state";
import {
  ADMIN_DISCOUNT_TYPE_FORM_OPTIONS,
  type DiscountTypeValue,
} from "@/lib/discounts/constants";
import type { AdminDiscountDetail } from "@/lib/discounts/admin-types";
import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { FormInputField } from "@/components/ui/form-input-field";
import { SelectField } from "@/components/ui/select-field";

type DiscountFormMode = "create" | "edit";

type DiscountFormAction = (
  prevState: DiscountFormState,
  formData: FormData,
) => Promise<DiscountFormState> | DiscountFormState;

type DiscountFormProps = {
  mode: DiscountFormMode;
  action: DiscountFormAction;
  initialDiscount?: AdminDiscountDetail;
  cancelHref?: string;
  returnTo?: string;
};

const fallbackInitial: AdminDiscountDetail = {
  id: "",
  name: "",
  code: "",
  discountType: "FIXED",
  discountValue: "",
  minOrderAmount: "",
  maxDiscountAmount: "",
  startDate: "",
  endDate: "",
  isActive: true,
};

const COMPACT_INPUT_CLASS_NAME =
  "peer h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 pb-1 pt-3 text-sm leading-5 text-neutral-900 outline-none ring-0 transition-colors placeholder:text-transparent focus:border-[var(--store-brand-primary)] focus:ring-0";
const COMPACT_LABEL_CLASS_NAME =
  "pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 bg-white px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500 transition-all duration-150 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[10px] peer-focus:text-[var(--store-brand-primary)] peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-neutral-600";

export const DiscountForm = ({
  mode,
  action,
  initialDiscount,
  cancelHref = "/dashboard/discounts",
  returnTo,
}: DiscountFormProps) => {
  const [state, formAction, isPending] = useActionState<
    DiscountFormState,
    FormData
  >(action, initialDiscountFormState);

  const initial = initialDiscount ?? fallbackInitial;
  const [typeInput, setTypeInput] = useState<DiscountTypeValue>(
    initial.discountType,
  );

  const submitLabel = mode === "create" ? "Create discount" : "Save";
  const pendingLabel = mode === "create" ? "Creating…" : "Saving…";

  const valueLabel =
    typeInput === "PERCENTAGE"
      ? "Discount value (%)"
      : "Discount amount (currency)";
  const valueHint =
    typeInput === "PERCENTAGE"
      ? "Enter a whole or decimal percent between 1 and 100."
      : "Fixed amount applied to the order; cannot exceed the order total at checkout.";

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
      noValidate
    >
      {mode === "edit" && initialDiscount ? (
        <>
          <input type="hidden" name="discountId" value={initialDiscount.id} />
          {returnTo ? (
            <input type="hidden" name="returnTo" value={returnTo} />
          ) : null}
        </>
      ) : null}

      {state.errorMessage ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.errorMessage}
        </p>
      ) : null}

      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-neutral-900">
          {mode === "create" ? "New discount" : "Discount details"}
        </h2>
        <p className="text-sm text-neutral-500">
          Fixed discounts subtract a set amount. Percentage discounts scale with
          the order; optional caps limit the maximum applied amount.
        </p>
      </div>

      <FormInputField
        label="Discount name"
        name="name"
        required
        minLength={1}
        maxLength={200}
        defaultValue={initial.name}
        aria-invalid={state.fieldErrors.name ? true : undefined}
        inputClassName={COMPACT_INPUT_CLASS_NAME}
        labelClassName={COMPACT_LABEL_CLASS_NAME}
      />
      <FieldError message={state.fieldErrors.name} />

      <FormInputField
        label="Discount code"
        name="code"
        required
        maxLength={40}
        defaultValue={initial.code}
        autoComplete="off"
        spellCheck={false}
        aria-invalid={state.fieldErrors.code ? true : undefined}
        inputClassName={`${COMPACT_INPUT_CLASS_NAME} uppercase`}
        labelClassName={COMPACT_LABEL_CLASS_NAME}
      />
      <FieldError message={state.fieldErrors.code} />

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Discount type"
          name="discountType"
          options={ADMIN_DISCOUNT_TYPE_FORM_OPTIONS}
          defaultValue={initial.discountType}
          variant="floating"
          size="md"
          required
          error={state.fieldErrors.discountType ?? null}
          onChange={(event) =>
            setTypeInput(event.target.value as DiscountTypeValue)
          }
        />
        <div>
          <FormInputField
            label={valueLabel}
            name="discountValue"
            type="text"
            inputMode="decimal"
            required
            defaultValue={initial.discountValue}
            aria-invalid={state.fieldErrors.discountValue ? true : undefined}
            inputClassName={COMPACT_INPUT_CLASS_NAME}
            labelClassName={COMPACT_LABEL_CLASS_NAME}
          />
          <p className="mt-1.5 text-xs text-neutral-500">{valueHint}</p>
          <FieldError message={state.fieldErrors.discountValue} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <FormInputField
            label="Minimum order amount"
            name="minOrderAmount"
            type="text"
            inputMode="decimal"
            defaultValue={initial.minOrderAmount}
            aria-invalid={state.fieldErrors.minOrderAmount ? true : undefined}
            inputClassName={COMPACT_INPUT_CLASS_NAME}
            labelClassName={COMPACT_LABEL_CLASS_NAME}
          />
          <p className="mt-1.5 text-xs text-neutral-500">
            Optional. Discount applies only when the order total is at least
            this amount.
          </p>
          <FieldError message={state.fieldErrors.minOrderAmount} />
        </div>
        <div>
          <FormInputField
            label="Maximum discount amount"
            name="maxDiscountAmount"
            type="text"
            inputMode="decimal"
            defaultValue={initial.maxDiscountAmount}
            aria-invalid={
              state.fieldErrors.maxDiscountAmount ? true : undefined
            }
            inputClassName={COMPACT_INPUT_CLASS_NAME}
            labelClassName={COMPACT_LABEL_CLASS_NAME}
          />
          <p className="mt-1.5 text-xs text-neutral-500">
            Optional. Caps the applied discount (especially useful for
            percentage rules).
          </p>
          <FieldError message={state.fieldErrors.maxDiscountAmount} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <FormInputField
            label="Start date"
            name="startDate"
            type="date"
            defaultValue={initial.startDate}
            aria-invalid={state.fieldErrors.startDate ? true : undefined}
            inputClassName={COMPACT_INPUT_CLASS_NAME}
            labelClassName={COMPACT_LABEL_CLASS_NAME}
          />
          <FieldError message={state.fieldErrors.startDate} />
        </div>
        <div>
          <FormInputField
            label="End date"
            name="endDate"
            type="date"
            defaultValue={initial.endDate}
            aria-invalid={state.fieldErrors.endDate ? true : undefined}
            inputClassName={COMPACT_INPUT_CLASS_NAME}
            labelClassName={COMPACT_LABEL_CLASS_NAME}
          />
          <FieldError message={state.fieldErrors.endDate} />
        </div>
      </div>

      <CheckboxField
        name="isActive"
        defaultChecked={initial.isActive}
        label="Active (eligible when within date range and other rules)"
        labelClassName="text-neutral-800"
      />

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

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p role="alert" className="text-xs text-red-600">
      {message}
    </p>
  ) : (
    <span aria-hidden />
  );
