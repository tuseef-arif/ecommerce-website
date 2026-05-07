"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
      router.replace("/dashboard/products?status=deleted");
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex items-center justify-end gap-1.5">
        <Link
          href={`/dashboard/products/${productId}/edit`}
          className="inline-flex min-h-8 items-center justify-center rounded-lg border border-neutral-300 bg-white px-2.5 text-xs font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
        >
          Edit
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
