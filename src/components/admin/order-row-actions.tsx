"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteOrderAction } from "@/app/(admin)/dashboard/orders/actions";
import type { DeleteOrderResult } from "@/app/(admin)/dashboard/orders/form-state";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type OrderRowActionsProps = {
  orderId: string;
  shortId: string;
};

const errorMessageFor = (result: DeleteOrderResult): string => {
  if (result.ok) return "";
  if (result.error === "not_found") return "Order no longer exists.";
  if (result.error === "invalid_id") return "Invalid order id.";
  return "Could not delete order. Try again.";
};

export const OrderRowActions = ({ orderId, shortId }: OrderRowActionsProps) => {
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
      <div className="flex items-center justify-end gap-1.5">
        <Link
          href={`/dashboard/orders/${orderId}`}
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
