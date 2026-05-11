"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteHeroSlideAction } from "@/app/(admin)/dashboard/banner/actions";
import type { DeleteHeroSlideResult } from "@/app/(admin)/dashboard/banner/form-state";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type HeroSlideRowActionsProps = {
  slideId: string;
  slideName: string;
};

const deleteErrorMessageFor = (result: DeleteHeroSlideResult): string => {
  if (result.ok) return "";
  if (result.error === "not_found") return "Slide no longer exists.";
  if (result.error === "invalid_id") return "Invalid slide id.";
  return "Could not delete slide. Try again.";
};

export const HeroSlideRowActions = ({
  slideId,
  slideName,
}: HeroSlideRowActionsProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleConfirmDelete = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await deleteHeroSlideAction(slideId);
      if (!result.ok) {
        setErrorMessage(deleteErrorMessageFor(result));
        return;
      }
      setIsOpen(false);
      router.replace("/dashboard/banner?status=deleted");
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex items-center justify-end">
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
        title="Delete this hero slide?"
        description={
          <>
            This will permanently remove{" "}
            <span className="font-semibold text-neutral-800">{slideName}</span>{" "}
            and its uploaded image. This action cannot be undone.
          </>
        }
        confirmLabel="Delete slide"
        confirmVariant="danger"
        isPending={isPending}
        errorMessage={errorMessage}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};
