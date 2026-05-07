"use client";

import type { ReactNode } from "react";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonVariant;
  isPending?: boolean;
  errorMessage?: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

export const ConfirmDialog = ({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  isPending = false,
  errorMessage,
  onConfirm,
  onClose,
}: ConfirmDialogProps) => (
  <Modal
    isOpen={isOpen}
    onClose={() => {
      if (!isPending) onClose();
    }}
    title={title}
    description={description}
    closeOnBackdropClick={!isPending}
    footer={
      <>
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={isPending}
          type="button"
        >
          {cancelLabel}
        </Button>
        <Button
          variant={confirmVariant}
          onClick={onConfirm}
          isLoading={isPending}
          loadingLabel={`${confirmLabel}…`}
          type="button"
        >
          {confirmLabel}
        </Button>
      </>
    }
  >
    {errorMessage ? (
      <p
        role="alert"
        className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        {errorMessage}
      </p>
    ) : null}
  </Modal>
);
