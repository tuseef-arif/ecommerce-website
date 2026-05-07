"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteCustomerAction } from "@/app/(admin)/dashboard/customers/actions";
import type { DeleteCustomerResult } from "@/app/(admin)/dashboard/customers/form-state";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type CustomerRowActionsProps = {
  customerId: string;
  customerName: string;
};

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

export const CustomerRowActions = ({
  customerId,
  customerName,
}: CustomerRowActionsProps) => {
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
      <div className="flex items-center justify-end gap-1.5">
        <Link
          href={`/dashboard/customers/${customerId}`}
          className="inline-flex min-h-8 items-center justify-center rounded-lg border border-neutral-300 bg-white px-2.5 text-xs font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
        >
          View
        </Link>
        <Button
          variant="danger"
          size="sm"
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
