"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteOrderAction } from "@/app/(admin)/dashboard/orders/actions";
import type { DeleteOrderResult } from "@/app/(admin)/dashboard/orders/form-state";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type OrderDetailActionsProps = {
  orderId: string;
  shortId: string;
};

const EDIT_BUTTON_CLASS_NAME =
  "inline-flex h-10 items-center justify-center rounded-lg border border-transparent bg-[var(--store-brand-primary)] px-4 text-sm font-semibold text-white shadow-sm transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]";

const errorMessageFor = (result: DeleteOrderResult): string => {
  if (result.ok) return "";
  if (result.error === "not_found") return "Order no longer exists.";
  if (result.error === "invalid_id") return "Invalid order id.";
  return "Could not delete order. Try again.";
};

export const OrderDetailActions = ({
  orderId,
  shortId,
}: OrderDetailActionsProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await deleteOrderAction(orderId);
      if (!result.ok) {
        setErrorMessage(errorMessageFor(result));
        return;
      }
      setIsOpen(false);
      router.replace("/dashboard/orders?status=deleted");
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          href={`/dashboard/orders/${orderId}/edit`}
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
        title="Delete this order?"
        description={
          <>
            This will permanently remove order{" "}
            <span className="font-mono font-semibold text-neutral-800">
              #{shortId}
            </span>{" "}
            and its line items. Stock previously reduced by this order will
            <span className="italic"> not</span> be restored automatically.
          </>
        }
        confirmLabel="Delete order"
        confirmVariant="danger"
        isPending={isPending}
        errorMessage={errorMessage}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
};
