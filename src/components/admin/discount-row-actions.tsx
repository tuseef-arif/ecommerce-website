"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteDiscountAction,
  setDiscountActiveAction,
} from "@/app/(admin)/dashboard/discounts/actions";
import type {
  DeleteDiscountResult,
  SetDiscountActiveResult,
} from "@/app/(admin)/dashboard/discounts/form-state";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type DiscountRowActionsProps = {
  discountId: string;
  discountName: string;
  isActive: boolean;
};

const deleteErrorMessageFor = (result: DeleteDiscountResult): string => {
  if (result.ok) return "";
  if (result.error === "not_found") return "Discount no longer exists.";
  if (result.error === "invalid_id") return "Invalid discount id.";
  return "Could not delete discount. Try again.";
};

const toggleErrorMessageFor = (result: SetDiscountActiveResult): string => {
  if (result.ok) return "";
  if (result.error === "not_found") return "Discount no longer exists.";
  if (result.error === "invalid_id") return "Invalid discount id.";
  return "Could not update status. Try again.";
};

export const DiscountRowActions = ({
  discountId,
  discountName,
  isActive,
}: DiscountRowActionsProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleConfirmDelete = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await deleteDiscountAction(discountId);
      if (!result.ok) {
        setErrorMessage(deleteErrorMessageFor(result));
        return;
      }
      setIsOpen(false);
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("status", "deleted");
      const nextQuery = nextParams.toString();
      router.replace(
        nextQuery
          ? `/dashboard/discounts?${nextQuery}`
          : "/dashboard/discounts",
      );
      router.refresh();
    });
  };

  const handleToggleActive = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await setDiscountActiveAction(discountId, !isActive);
      if (!result.ok) {
        setErrorMessage(toggleErrorMessageFor(result));
        return;
      }
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("status", "updated");
      const nextQuery = nextParams.toString();
      router.replace(
        nextQuery
          ? `/dashboard/discounts?${nextQuery}`
          : "/dashboard/discounts",
      );
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleToggleActive}
          disabled={isPending}
        >
          {isActive ? "Deactivate" : "Activate"}
        </Button>
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
        title="Delete this discount?"
        description={
          <>
            This will permanently remove{" "}
            <span className="font-semibold text-neutral-800">
              {discountName}
            </span>
            . This action cannot be undone.
          </>
        }
        confirmLabel="Delete discount"
        confirmVariant="danger"
        isPending={isPending}
        errorMessage={errorMessage}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};
