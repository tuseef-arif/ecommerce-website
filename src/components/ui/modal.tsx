"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /**
   * If true, clicking the backdrop closes the modal. Defaults to true.
   * Set to false for destructive flows where accidental dismissal would be bad.
   */
  closeOnBackdropClick?: boolean;
  size?: "sm" | "md";
};

const sizeClassMap: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  closeOnBackdropClick = true,
  size = "sm",
}: ModalProps) => {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;
  if (typeof window === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        onClick={() => {
          if (closeOnBackdropClick) onClose();
        }}
        className="absolute inset-0 h-full w-full cursor-default bg-black/50 backdrop-blur-sm"
        tabIndex={-1}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`relative w-full ${sizeClassMap[size]} rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl outline-none`}
      >
        <div className="space-y-1.5">
          <h2
            id={titleId}
            className="text-base font-bold text-neutral-900 sm:text-lg"
          >
            {title}
          </h2>
          {description ? (
            <p id={descriptionId} className="text-sm text-neutral-600">
              {description}
            </p>
          ) : null}
        </div>
        <div className="mt-4">{children}</div>
        {footer ? (
          <div className="mt-5 flex flex-wrap-reverse justify-end gap-2">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
};
