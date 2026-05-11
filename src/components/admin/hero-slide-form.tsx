"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  initialHeroSlideFormState,
  type HeroSlideFormState,
} from "@/app/(admin)/dashboard/banner/form-state";
import { HeroLinkedProductsPicker } from "@/components/admin/hero-linked-products-picker";
import { HeroSlideImageUploader } from "@/components/admin/hero-slide-image-uploader";
import { HeroSpecListEditor } from "@/components/admin/hero-spec-list-editor";
import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { FormInputField } from "@/components/ui/form-input-field";
import {
  HERO_SLIDE_ALT_MAX,
  HERO_SLIDE_NAME_MAX,
  HERO_SLIDE_SORT_ORDER_MAX,
} from "@/lib/hero/admin-schemas";
import { HERO_IMAGE_MAX_BYTES } from "@/lib/hero/image-constants";
import type { AdminHeroSlideDetail } from "@/lib/hero/admin-types";

type HeroSlideFormMode = "create" | "edit";

type HeroSlideFormAction = (
  prevState: HeroSlideFormState,
  formData: FormData,
) => Promise<HeroSlideFormState> | HeroSlideFormState;

type HeroSlideFormProps = {
  mode: HeroSlideFormMode;
  action: HeroSlideFormAction;
  initialSlide?: AdminHeroSlideDetail;
  cancelHref?: string;
};

const fallbackInitial: AdminHeroSlideDetail = {
  id: "",
  name: "",
  imageAlt: "",
  imagePath: null,
  specs: [],
  sortOrder: 0,
  isActive: true,
  linkedProducts: [],
};

const COMPACT_INPUT_CLASS_NAME =
  "peer h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 pb-1 pt-3 text-sm leading-5 text-neutral-900 outline-none ring-0 transition-colors placeholder:text-transparent focus:border-[var(--store-brand-primary)] focus:ring-0";
const COMPACT_LABEL_CLASS_NAME =
  "pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 bg-white px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500 transition-all duration-150 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[10px] peer-focus:text-[var(--store-brand-primary)] peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-neutral-600";

export const HeroSlideForm = ({
  mode,
  action,
  initialSlide,
  cancelHref = "/dashboard/banner",
}: HeroSlideFormProps) => {
  const [state, formAction, isPending] = useActionState<
    HeroSlideFormState,
    FormData
  >(action, initialHeroSlideFormState);

  const initial = initialSlide ?? fallbackInitial;

  const submitLabel = mode === "create" ? "Create slide" : "Save";
  const pendingLabel = mode === "create" ? "Creating…" : "Saving…";

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
      noValidate
    >
      {mode === "edit" && initialSlide ? (
        <input type="hidden" name="slideId" value={initialSlide.id} />
      ) : null}

      {state.errorMessage ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.errorMessage}
        </p>
      ) : null}

      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-neutral-900">
          {mode === "create" ? "New hero slide" : "Slide details"}
        </h2>
        <p className="text-sm text-neutral-500">
          Each active slide rotates in the storefront hero. Use a tight,
          contrast-aware product photo and short bullet specs.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <HeroSlideImageUploader
            existingImagePath={initial.imagePath}
            errorMessage={state.fieldErrors.image ?? null}
            maxBytes={HERO_IMAGE_MAX_BYTES}
          />
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Button
            type="submit"
            variant="primary"
            isLoading={isPending}
            loadingLabel={pendingLabel}
          >
            {submitLabel}
          </Button>
          <Link
            href={cancelHref}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            Cancel
          </Link>
        </div>
      </div>

      <FormInputField
        label="Name"
        name="name"
        required
        minLength={1}
        maxLength={HERO_SLIDE_NAME_MAX}
        defaultValue={initial.name}
        aria-invalid={state.fieldErrors.name ? true : undefined}
        inputClassName={COMPACT_INPUT_CLASS_NAME}
        labelClassName={COMPACT_LABEL_CLASS_NAME}
      />
      <FieldError message={state.fieldErrors.name} />

      <FormInputField
        label="Image alt text"
        name="imageAlt"
        required
        minLength={1}
        maxLength={HERO_SLIDE_ALT_MAX}
        defaultValue={initial.imageAlt}
        aria-invalid={state.fieldErrors.imageAlt ? true : undefined}
        inputClassName={COMPACT_INPUT_CLASS_NAME}
        labelClassName={COMPACT_LABEL_CLASS_NAME}
      />
      <p className="-mt-2 text-xs text-neutral-500">
        Briefly describe the image for screen readers. E.g. &ldquo;Samsung
        Galaxy S26 Ultra in titanium black, front and back view&rdquo;.
      </p>
      <FieldError message={state.fieldErrors.imageAlt} />

      <HeroSpecListEditor
        initialValues={initial.specs}
        errorMessage={state.fieldErrors.specs ?? null}
      />

      <HeroLinkedProductsPicker
        initialSelected={initial.linkedProducts}
        errorMessage={state.fieldErrors.linkedProducts ?? null}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <FormInputField
            label="Sort order"
            name="sortOrder"
            type="number"
            min="0"
            max={String(HERO_SLIDE_SORT_ORDER_MAX)}
            step="1"
            inputMode="numeric"
            required
            defaultValue={String(initial.sortOrder)}
            aria-invalid={state.fieldErrors.sortOrder ? true : undefined}
            inputClassName={COMPACT_INPUT_CLASS_NAME}
            labelClassName={COMPACT_LABEL_CLASS_NAME}
          />
          <p className="mt-1.5 text-xs text-neutral-500">
            Lower values render first. Ties break by creation date.
          </p>
          <FieldError message={state.fieldErrors.sortOrder} />
        </div>
        <div className="flex items-end">
          <CheckboxField
            name="isActive"
            defaultChecked={initial.isActive}
            label="Active (visible in the storefront hero)"
            labelClassName="text-neutral-800"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-neutral-200 pt-4">
        <Button
          type="submit"
          variant="primary"
          isLoading={isPending}
          loadingLabel={pendingLabel}
        >
          {submitLabel}
        </Button>
        <Link
          href={cancelHref}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
};

const FieldError = ({ message }: { message?: string }) => {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs text-red-600">
      {message}
    </p>
  );
};
