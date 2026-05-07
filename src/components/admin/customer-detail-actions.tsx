"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteCustomerAction } from "@/app/(admin)/dashboard/customers/actions";
import type { DeleteCustomerResult } from "@/app/(admin)/dashboard/customers/form-state";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type CustomerDetailActionsProps = {
  customerId: string;
  customerName: string;
};

const EDIT_BUTTON_CLASS_NAME =
  "inline-flex h-10 items-center justify-center rounded-lg border border-transparent bg-[var(--store-brand-primary)] px-4 text-sm font-semibold text-white shadow-sm transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]";

const errorMessageFor = (result: DeleteCustomerResult): string => {
  if (result.ok) return "";
  if (result.error === "not_found") return "Customer no longer exists.";
  if (result.error === "self_delete")
    return "You cannot delete your own admin account.";
  if (result.error === "in_use")
    return "Cannot delete: this customer has existing orders. Reassign or remove the orders first.";
  if (result.error === "invalid_id") return "Invalid customer id.";
  return "Could not delete customer. Try again.";
};

export const CustomerDetailActions = ({
  customerId,
  customerName,
}: CustomerDetailActionsProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await deleteCustomerAction(customerId);
      if (!result.ok) {
        setErrorMessage(errorMessageFor(result));
        return;
      }
      setIsOpen(false);
      router.replace("/dashboard/customers?status=deleted");
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          href={`/dashboard/customers/${customerId}/edit`}
          className={EDIT_BUTTON_CLASS_NAME}
        >
          Edit
        </Link>
        <Button
          variant="danger"
          onClick={() => {
            setErrorMessage(null);
            setIsOpen(true);
          }}
          disabled={isPending}
        >
          Delete
        </Button>
      </div>

      <ConfirmDialog
        isOpen={isOpen}
        title="Delete this customer?"
        description={
          <>
            This will permanently remove{" "}
            <span className="font-semibold text-neutral-800">
              {customerName}
            </span>{" "}
            and any cart contents they have. Customers with existing orders
            cannot be deleted.
          </>
        }
        confirmLabel="Delete customer"
        confirmVariant="danger"
        isPending={isPending}
        errorMessage={errorMessage}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
};
