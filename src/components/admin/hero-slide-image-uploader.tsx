"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { HERO_IMAGE_ACCEPT_MIME } from "@/lib/hero/image-constants";

type HeroSlideImageUploaderProps = {
  /** Existing image path/URL when editing; null on create. */
  existingImagePath: string | null;
  /** Hidden field name for the file input. */
  fieldName?: string;
  errorMessage?: string | null;
  maxBytes: number;
};

const formatMaxSize = (bytes: number): string =>
  `${Math.round(bytes / (1024 * 1024))} MB`;

export const HeroSlideImageUploader = ({
  existingImagePath,
  fieldName = "image",
  errorMessage,
  maxBytes,
}: HeroSlideImageUploaderProps) => {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const acceptedMimeTypes = HERO_IMAGE_ACCEPT_MIME.split(",").map((s) =>
    s.trim(),
  );

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
      setClientError(null);
      return;
    }
    if (!acceptedMimeTypes.includes(file.type)) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setClientError("Image must be a JPEG, PNG, or WebP file.");
      return;
    }
    if (file.size > maxBytes) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setClientError(`Image is too large. Max ${formatMaxSize(maxBytes)}.`);
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setClientError(null);
  };

  const handleClearPicked = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setClientError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const showingPreview = previewUrl !== null;
  const showingExisting = !showingPreview && Boolean(existingImagePath);

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="text-xs font-semibold uppercase tracking-wide text-neutral-600"
      >
        Hero image
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="relative flex h-32 w-44 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-neutral-300 bg-neutral-50">
          {showingPreview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
            <img
              src={previewUrl ?? undefined}
              alt="Selected image preview"
              className="h-full w-full object-contain"
            />
          ) : showingExisting && existingImagePath ? (
            // eslint-disable-next-line @next/next/no-img-element -- mixed local/remote thumbnail
            <img
              src={existingImagePath}
              alt="Current hero image"
              className="h-full w-full object-contain"
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
            accept={HERO_IMAGE_ACCEPT_MIME}
            onChange={handleFileChange}
            className="block w-full text-sm text-neutral-700 file:mr-3 file:w-36 file:rounded-lg file:border file:border-neutral-300 file:bg-white file:px-3 file:py-1.5 file:text-center file:text-sm file:font-semibold file:text-neutral-700 hover:file:bg-neutral-50"
          />
          <p className="text-xs text-neutral-500">
            JPEG, PNG, or WebP · up to {formatMaxSize(maxBytes)}. Use a
            transparent background or matching color when possible.
          </p>

          {showingPreview ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleClearPicked}
              className="w-36 self-start justify-center"
            >
              Clear Image
            </Button>
          ) : null}

          {clientError || errorMessage ? (
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700"
            >
              {clientError ?? errorMessage}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};
