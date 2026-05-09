"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProductAction } from "@/app/(admin)/dashboard/products/actions";
import type { DeleteProductResult } from "@/app/(admin)/dashboard/products/form-state";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type ProductRowActionsProps = {
  productId: string;
  productName: string;
};

const errorMessageFor = (result: DeleteProductResult): string => {
  if (result.ok) return "";
  if (result.error === "not_found") return "Product no longer exists.";
  if (result.error === "in_use")
    return "Cannot delete: this product is referenced by existing orders or carts.";
  if (result.error === "invalid_id") return "Invalid product id.";
  return "Could not delete product. Try again.";
};

export const ProductRowActions = ({
  productId,
  productName,
}: ProductRowActionsProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await deleteProductAction(productId);
      if (!result.ok) {
        setErrorMessage(errorMessageFor(result));
        return;
      }
      setIsOpen(false);
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("status", "deleted");
      const nextQuery = nextParams.toString();
      router.replace(
        nextQuery ? `/dashboard/products?${nextQuery}` : "/dashboard/products",
      );
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex items-center justify-end gap-1.5">
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
        title="Delete this product?"
        description={
          <>
            This will permanently remove{" "}
            <span className="font-semibold text-neutral-800">
              {productName}
            </span>{" "}
            from the catalog. This action cannot be undone.
          </>
        }
        confirmLabel="Delete product"
        confirmVariant="danger"
        isPending={isPending}
        errorMessage={errorMessage}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
};
