"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { PRODUCT_IMAGE_ACCEPT_MIME } from "@/lib/products/image-constants";

type ProductImageUploaderProps = {
  /** Existing image path/URL when editing; null on create. */
  existingImagePath: string | null;
  /** Hidden field name for the file input. */
  fieldName?: string;
  /** Hidden field name for the "remove existing" toggle (edit only). */
  removeFieldName?: string;
  errorMessage?: string | null;
  maxBytes: number;
};

const formatMaxSize = (bytes: number): string =>
  `${Math.round(bytes / (1024 * 1024))} MB`;

export const ProductImageUploader = ({
  existingImagePath,
  fieldName = "image",
  removeFieldName = "removeImage",
  errorMessage,
  maxBytes,
}: ProductImageUploaderProps) => {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pickedFileName, setPickedFileName] = useState<string | null>(null);
  const [isMarkedForRemoval, setIsMarkedForRemoval] = useState(false);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setPickedFileName(null);
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setPickedFileName(file.name);
    setIsMarkedForRemoval(false);
  };

  const handleClearPicked = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPickedFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const showingPreview = previewUrl !== null;
  const showingExisting =
    !showingPreview && Boolean(existingImagePath) && !isMarkedForRemoval;

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="text-xs font-semibold uppercase tracking-wide text-neutral-600"
      >
        Image
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-neutral-300 bg-neutral-50">
          {showingPreview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
            <img
              src={previewUrl ?? undefined}
              alt="Selected image preview"
              className="h-full w-full object-cover"
            />
          ) : showingExisting && existingImagePath ? (
            // eslint-disable-next-line @next/next/no-img-element -- mixed local/remote thumbnail
            <img
              src={existingImagePath}
              alt="Current product image"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="px-2 text-center text-xs font-medium text-neutral-400">
              No image
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            name={fieldName}
            accept={PRODUCT_IMAGE_ACCEPT_MIME}
            onChange={handleFileChange}
            className="block w-full text-sm text-neutral-700 file:mr-3 file:rounded-lg file:border file:border-neutral-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-neutral-700 hover:file:bg-neutral-50"
          />
          <p className="text-xs text-neutral-500">
            JPEG, PNG, or WebP · up to {formatMaxSize(maxBytes)}.
          </p>

          {pickedFileName ? (
            <div className="flex items-center justify-between gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-xs text-neutral-700">
              <span className="truncate" title={pickedFileName}>
                {pickedFileName}
              </span>
              <button
                type="button"
                onClick={handleClearPicked}
                className="font-semibold text-neutral-700 underline-offset-2 hover:underline"
              >
                Clear
              </button>
            </div>
          ) : null}

          {existingImagePath && !showingPreview ? (
            <CheckboxField
              name={removeFieldName}
              checked={isMarkedForRemoval}
              onChange={(event) =>
                setIsMarkedForRemoval(event.currentTarget.checked)
              }
              label="Remove current image on save"
              className="text-xs"
            />
          ) : null}

          {showingPreview ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearPicked}
              className="self-start"
            >
              Discard preview
            </Button>
          ) : null}

          {errorMessage ? (
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700"
            >
              {errorMessage}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};
