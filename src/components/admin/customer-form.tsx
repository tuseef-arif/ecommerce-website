"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  initialCustomerFormState,
  type CustomerFormState,
} from "@/app/(admin)/dashboard/customers/form-state";
import { Button } from "@/components/ui/button";
import { FormInputField } from "@/components/ui/form-input-field";
import { SelectField } from "@/components/ui/select-field";
import type { AdminCustomerDetail } from "@/lib/customers/admin-types";
import { formatInstantForStoreDateTime } from "@/lib/datetime/display-timezone";

type CustomerFormMode = "create" | "edit";

type CustomerFormAction = (
  prevState: CustomerFormState,
  formData: FormData,
) => Promise<CustomerFormState> | CustomerFormState;

type CustomerFormProps = {
  mode: CustomerFormMode;
  action: CustomerFormAction;
  /** When editing, the existing customer detail; absent on create. */
  initialCustomer?: AdminCustomerDetail;
};

const fallbackInitial = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  city: "",
  country: "",
  role: "USER" as const,
  status: "ACTIVE" as const,
  ordersCount: 0,
  updatedAtIso: "",
};

const cancelHref = "/dashboard/customers";
const ROLE_OPTIONS = [
  { value: "USER", label: "User" },
  { value: "ADMIN", label: "Admin" },
] as const;
const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
] as const;

const COMPACT_INPUT_CLASS_NAME =
  "peer h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 pb-1 pt-3 text-sm leading-5 text-neutral-900 outline-none ring-0 transition-colors placeholder:text-transparent focus:border-[var(--store-brand-primary)] focus:ring-0";
const COMPACT_LABEL_CLASS_NAME =
  "pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 bg-white px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500 transition-all duration-150 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[10px] peer-focus:text-[var(--store-brand-primary)] peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-neutral-600";

export const CustomerForm = ({
  mode,
  action,
  initialCustomer,
}: CustomerFormProps) => {
  const [state, formAction, isPending] = useActionState<
    CustomerFormState,
    FormData
  >(action, initialCustomerFormState);

  const initial = initialCustomer ?? fallbackInitial;

  const submitLabel = mode === "create" ? "Create customer" : "Save";
  const pendingLabel = mode === "create" ? "Creating…" : "Saving…";

  const [roleInput, setRoleInput] = useState<"USER" | "ADMIN">(initial.role);
  const [statusInput, setStatusInput] = useState<"ACTIVE" | "INACTIVE">(
    initial.status,
  );
  const modifiedAtDisplay =
    mode === "edit" && initial.updatedAtIso
      ? formatInstantForStoreDateTime(initial.updatedAtIso)
      : "—";

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
      noValidate
    >
      {mode === "edit" && initialCustomer ? (
        <input type="hidden" name="customerId" value={initialCustomer.id} />
      ) : null}

      {state.errorMessage ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.errorMessage}
        </p>
      ) : null}

      <div className="min-w-0">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-neutral-900">
            {mode === "create" ? "Customer details" : initial.email}
          </h2>
          {mode === "edit" && initialCustomer ? (
            <p className="text-sm text-neutral-500">
              {initialCustomer.ordersCount} order
              {initialCustomer.ordersCount === 1 ? "" : "s"} on file.
            </p>
          ) : (
            <p className="text-sm text-neutral-500">
              Add a new shopper or staff member to the platform.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormInputField
          label="First name"
          name="firstName"
          maxLength={80}
          defaultValue={initial.firstName}
          aria-invalid={state.fieldErrors.firstName ? true : undefined}
          inputClassName={COMPACT_INPUT_CLASS_NAME}
          labelClassName={COMPACT_LABEL_CLASS_NAME}
        />
        <FormInputField
          label="Last name"
          name="lastName"
          maxLength={80}
          defaultValue={initial.lastName}
          aria-invalid={state.fieldErrors.lastName ? true : undefined}
          inputClassName={COMPACT_INPUT_CLASS_NAME}
          labelClassName={COMPACT_LABEL_CLASS_NAME}
        />
      </div>
      <FieldErrorPair
        leftMessage={state.fieldErrors.firstName}
        rightMessage={state.fieldErrors.lastName}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <FormInputField
          label="Email"
          name="email"
          type="email"
          required
          maxLength={254}
          defaultValue={initial.email}
          aria-invalid={state.fieldErrors.email ? true : undefined}
          inputClassName={COMPACT_INPUT_CLASS_NAME}
          labelClassName={COMPACT_LABEL_CLASS_NAME}
          autoComplete="off"
        />
        <FormInputField
          label="Phone"
          name="phone"
          type="tel"
          maxLength={40}
          defaultValue={initial.phone}
          aria-invalid={state.fieldErrors.phone ? true : undefined}
          inputClassName={COMPACT_INPUT_CLASS_NAME}
          labelClassName={COMPACT_LABEL_CLASS_NAME}
          autoComplete="off"
        />
      </div>
      <FieldErrorPair
        leftMessage={state.fieldErrors.email}
        rightMessage={state.fieldErrors.phone}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <FormInputField
          label="Address"
          name="address"
          maxLength={200}
          defaultValue={initial.address}
          aria-invalid={state.fieldErrors.address ? true : undefined}
          inputClassName={COMPACT_INPUT_CLASS_NAME}
          labelClassName={COMPACT_LABEL_CLASS_NAME}
          autoComplete="off"
        />
        <FormInputField
          label="City"
          name="city"
          maxLength={80}
          defaultValue={initial.city}
          aria-invalid={state.fieldErrors.city ? true : undefined}
          inputClassName={COMPACT_INPUT_CLASS_NAME}
          labelClassName={COMPACT_LABEL_CLASS_NAME}
          autoComplete="off"
        />
        <FormInputField
          label="Country"
          name="country"
          maxLength={80}
          defaultValue={initial.country}
          aria-invalid={state.fieldErrors.country ? true : undefined}
          inputClassName={COMPACT_INPUT_CLASS_NAME}
          labelClassName={COMPACT_LABEL_CLASS_NAME}
          autoComplete="off"
        />
      </div>
      <FieldErrorTriple
        leftMessage={state.fieldErrors.address}
        middleMessage={state.fieldErrors.city}
        rightMessage={state.fieldErrors.country}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Role"
          name="role"
          variant="floating"
          size="sm"
          options={ROLE_OPTIONS}
          value={roleInput}
          onChange={(event) =>
            setRoleInput(
              (event.currentTarget.value as "USER" | "ADMIN") ?? "USER",
            )
          }
          error={state.fieldErrors.role ?? null}
        />
        <SelectField
          label="Status"
          name="status"
          variant="floating"
          size="sm"
          options={STATUS_OPTIONS}
          value={statusInput}
          onChange={(event) =>
            setStatusInput(
              (event.currentTarget.value as "ACTIVE" | "INACTIVE") ?? "ACTIVE",
            )
          }
          error={state.fieldErrors.status ?? null}
        />
      </div>
      <FieldErrorPair rightMessage={state.fieldErrors.status} />

      <div className="grid gap-4 md:grid-cols-2">
        {mode === "edit" ? (
          <FormInputField
            label="Modified date"
            name="modifiedDatePreview"
            type="text"
            readOnly
            disabled
            value={modifiedAtDisplay}
            inputClassName={COMPACT_INPUT_CLASS_NAME}
            labelClassName={COMPACT_LABEL_CLASS_NAME}
          />
        ) : (
          <div />
        )}
        <FormInputField
          label={mode === "create" ? "Password" : "New password (optional)"}
          name="password"
          type="password"
          required={mode === "create"}
          minLength={mode === "create" ? 8 : undefined}
          maxLength={200}
          aria-invalid={state.fieldErrors.password ? true : undefined}
          inputClassName={COMPACT_INPUT_CLASS_NAME}
          labelClassName={COMPACT_LABEL_CLASS_NAME}
          autoComplete="new-password"
        />
      </div>
      <FieldErrorPair rightMessage={state.fieldErrors.password} />

      {mode === "edit" ? (
        <p className="text-xs text-neutral-500">
          Leave the password field blank to keep the customer&rsquo;s existing
          password unchanged. Set a new value to reset it.
        </p>
      ) : (
        <p className="text-xs text-neutral-500">
          The customer will use this email and password to sign in. Passwords
          must be at least 8 characters.
        </p>
      )}

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

const FieldErrorPair = ({
  leftMessage,
  rightMessage,
}: {
  leftMessage?: string;
  rightMessage?: string;
}) => {
  if (!leftMessage && !rightMessage) return null;
  return (
    <div className="-mt-2 grid gap-2 md:grid-cols-2">
      <FieldError message={leftMessage} />
      <FieldError message={rightMessage} />
    </div>
  );
};

const FieldErrorTriple = ({
  leftMessage,
  middleMessage,
  rightMessage,
}: {
  leftMessage?: string;
  middleMessage?: string;
  rightMessage?: string;
}) => {
  if (!leftMessage && !middleMessage && !rightMessage) return null;
  return (
    <div className="-mt-2 grid gap-2 md:grid-cols-3">
      <FieldError message={leftMessage} />
      <FieldError message={middleMessage} />
      <FieldError message={rightMessage} />
    </div>
  );
};
