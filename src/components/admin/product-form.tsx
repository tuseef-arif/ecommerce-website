"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  initialProductFormState,
  type ProductFormState,
} from "@/app/(admin)/dashboard/products/form-state";
import { ProductImageUploader } from "@/components/admin/product-image-uploader";
import { ProductOptionListEditor } from "@/components/admin/product-option-list-editor";
import { ProductSpecsEditor } from "@/components/admin/product-specs-editor";
import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { FormInputField } from "@/components/ui/form-input-field";
import { SelectField } from "@/components/ui/select-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { SITE_PRODUCT_FORM } from "@/lib/config/site-config";
import {
  previewDiscountedPrice,
  type ProductDiscountTypeValue,
} from "@/lib/products/discount";
import { PRODUCT_IMAGE_MAX_BYTES } from "@/lib/products/image-constants";
import type {
  AdminProductCategoryOption,
  AdminProductDetail,
  AdminProductSpecEntry,
} from "@/lib/products/admin-types";
import type { ProductVariantOption } from "@/lib/products/specs";

type ProductFormMode = "create" | "edit";

type ProductFormAction = (
  prevState: ProductFormState,
  formData: FormData,
) => Promise<ProductFormState> | ProductFormState;

type ProductFormProps = {
  mode: ProductFormMode;
  action: ProductFormAction;
  categories: ReadonlyArray<AdminProductCategoryOption>;
  /** When editing, the existing product detail; absent on create. */
  initialProduct?: AdminProductDetail;
};

const fallbackInitialDetail = {
  name: "",
  brand: "",
  model: "",
  description: "",
  imagePath: null as string | null,
  price: "",
  discountType: "NONE" as ProductDiscountTypeValue,
  discountValue: null as string | null,
  isDiscountActive: false,
  stock: 0,
  isActive: true,
  categoryId: "",
  specs: [] as AdminProductSpecEntry[],
  colorOptions: [] as ProductVariantOption[],
  storageOptions: [] as ProductVariantOption[],
};

const cancelHref = "/dashboard/products";
const discountTypeOptions = [
  { value: "NONE", label: "No discount" },
  { value: "FIXED", label: "Fixed" },
  { value: "PERCENT", label: "Percentage" },
] as const;
const COMPACT_INPUT_CLASS_NAME =
  "peer h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 pb-1 pt-3 text-sm leading-5 text-neutral-900 outline-none ring-0 transition-colors placeholder:text-transparent focus:border-[var(--store-brand-primary)] focus:ring-0";
const COMPACT_LABEL_CLASS_NAME =
  "pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 bg-white px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500 transition-all duration-150 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[10px] peer-focus:text-[var(--store-brand-primary)] peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-neutral-600";

export const ProductForm = ({
  mode,
  action,
  categories,
  initialProduct,
}: ProductFormProps) => {
  const [state, formAction, isPending] = useActionState<
    ProductFormState,
    FormData
  >(action, initialProductFormState);

  const initial = initialProduct ?? fallbackInitialDetail;

  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));
  const mobileCategoryId =
    categories.find((category) => category.slug === "mobiles")?.id ?? "";
  const defaultCategoryId =
    mode === "create" ? mobileCategoryId : initial.categoryId || "";
  if (
    initial.categoryId &&
    !categoryOptions.some((option) => option.value === initial.categoryId)
  ) {
    // Keep edit view stable even if the product points to a category not present
    // in the current dropdown payload.
    categoryOptions.unshift({
      value: initial.categoryId,
      label: "Current Category",
    });
  }

  const submitLabel = mode === "create" ? "Create product" : "Save";
  const pendingLabel = mode === "create" ? "Creating…" : "Saving…";

  const [priceInput, setPriceInput] = useState(initial.price);
  const [discountTypeInput, setDiscountTypeInput] =
    useState<ProductDiscountTypeValue>(initial.discountType);
  const [discountValueInput, setDiscountValueInput] = useState(
    initial.discountValue ?? "",
  );

  const discountedPricePreview = useMemo(
    () =>
      previewDiscountedPrice({
        priceRaw: priceInput,
        discountType: discountTypeInput,
        discountValueRaw: discountValueInput,
      }),
    [priceInput, discountTypeInput, discountValueInput],
  );

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
      noValidate
    >
      {mode === "edit" && initialProduct ? (
        <input type="hidden" name="productId" value={initialProduct.id} />
      ) : null}

      {state.errorMessage ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.errorMessage}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <ProductImageUploader
            existingImagePath={initial.imagePath}
            errorMessage={state.fieldErrors.image ?? null}
            maxBytes={PRODUCT_IMAGE_MAX_BYTES}
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
        minLength={2}
        maxLength={200}
        defaultValue={initial.name}
        aria-invalid={state.fieldErrors.name ? true : undefined}
        inputClassName={COMPACT_INPUT_CLASS_NAME}
        labelClassName={COMPACT_LABEL_CLASS_NAME}
      />
      {state.fieldErrors.name ? (
        <FieldError message={state.fieldErrors.name} />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <ProductOptionListEditor
          fieldName="colorsJson"
          legend={SITE_PRODUCT_FORM.colorsLegend}
          helperText={SITE_PRODUCT_FORM.colorsHelper}
          rowPlaceholder={SITE_PRODUCT_FORM.colorsRowPlaceholder}
          addCtaLabel={SITE_PRODUCT_FORM.colorsAddCta}
          initialValues={initial.colorOptions}
          errorMessage={state.fieldErrors.colors ?? null}
        />
        <ProductOptionListEditor
          fieldName="storagesJson"
          legend={SITE_PRODUCT_FORM.storagesLegend}
          helperText={SITE_PRODUCT_FORM.storagesHelper}
          rowPlaceholder={SITE_PRODUCT_FORM.storagesRowPlaceholder}
          addCtaLabel={SITE_PRODUCT_FORM.storagesAddCta}
          initialValues={initial.storageOptions}
          errorMessage={state.fieldErrors.storages ?? null}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormInputField
          label="Price"
          name="price"
          type="number"
          required
          min="0.01"
          step="0.01"
          inputMode="decimal"
          value={priceInput}
          onChange={(event) => setPriceInput(event.currentTarget.value)}
          aria-invalid={state.fieldErrors.price ? true : undefined}
          inputClassName={COMPACT_INPUT_CLASS_NAME}
          labelClassName={COMPACT_LABEL_CLASS_NAME}
        />
        <FormInputField
          label="Model"
          name="model"
          required
          maxLength={120}
          defaultValue={initial.model}
          aria-invalid={state.fieldErrors.model ? true : undefined}
          inputClassName={COMPACT_INPUT_CLASS_NAME}
          labelClassName={COMPACT_LABEL_CLASS_NAME}
        />
      </div>
      <FieldErrorPair
        leftMessage={state.fieldErrors.price}
        rightMessage={state.fieldErrors.model}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Discount Type"
          name="discountType"
          variant="floating"
          size="sm"
          options={discountTypeOptions}
          value={discountTypeInput}
          onChange={(event) =>
            setDiscountTypeInput(
              (event.currentTarget.value as ProductDiscountTypeValue) ?? "NONE",
            )
          }
          error={state.fieldErrors.discountType ?? null}
        />
        <SelectField
          label="Category"
          name="categoryId"
          variant="floating"
          size="sm"
          options={categoryOptions}
          placeholder={
            categoryOptions.length === 0
              ? "No categories available"
              : "Select a category"
          }
          required
          defaultValue={defaultCategoryId}
          error={state.fieldErrors.categoryId ?? null}
        />
      </div>
      <FieldErrorPair
        leftMessage={state.fieldErrors.discountType}
        rightMessage={state.fieldErrors.categoryId}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <FormInputField
          label={
            discountTypeInput === "PERCENT"
              ? "Discount Percentage"
              : "Discount Value"
          }
          name="discountValue"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={discountValueInput}
          onChange={(event) => setDiscountValueInput(event.currentTarget.value)}
          aria-invalid={state.fieldErrors.discountValue ? true : undefined}
          inputClassName={COMPACT_INPUT_CLASS_NAME}
          labelClassName={COMPACT_LABEL_CLASS_NAME}
        />
        <FormInputField
          label="Brand"
          name="brand"
          required
          maxLength={80}
          defaultValue={initial.brand}
          aria-invalid={state.fieldErrors.brand ? true : undefined}
          inputClassName={COMPACT_INPUT_CLASS_NAME}
          labelClassName={COMPACT_LABEL_CLASS_NAME}
        />
      </div>
      <FieldErrorPair
        leftMessage={state.fieldErrors.discountValue}
        rightMessage={state.fieldErrors.brand}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <FormInputField
          label="Discounted Price"
          name="discountedPricePreview"
          type="text"
          readOnly
          disabled
          value={discountedPricePreview}
          inputClassName={COMPACT_INPUT_CLASS_NAME}
          labelClassName={COMPACT_LABEL_CLASS_NAME}
        />
        <FormInputField
          label="Stock"
          name="stock"
          type="number"
          required
          min="0"
          step="1"
          inputMode="numeric"
          defaultValue={initial.stock ? String(initial.stock) : ""}
          aria-invalid={state.fieldErrors.stock ? true : undefined}
          inputClassName={COMPACT_INPUT_CLASS_NAME}
          labelClassName={COMPACT_LABEL_CLASS_NAME}
        />
      </div>
      <FieldErrorPair rightMessage={state.fieldErrors.stock} />

      <TextareaField
        label="Description"
        name="description"
        variant="floating"
        defaultValue={initial.description ?? ""}
        rows={5}
        maxLength={5000}
        error={state.fieldErrors.description ?? null}
      />

      <ProductSpecsEditor
        initialSpecs={initial.specs}
        errorMessage={state.fieldErrors.specs ?? null}
      />

      <CheckboxField
        name="isActive"
        defaultChecked={initial.isActive}
        label="Active (visible to shoppers)"
        labelClassName="text-neutral-800"
      />

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

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p role="alert" className="text-xs text-red-600">
      {message}
    </p>
  ) : (
    <span aria-hidden />
  );

/**
 * Renders a 2-column row of inline field errors that lines up with the input
 * grid above it. Renders nothing when both sides are empty so the form keeps
 * its vertical rhythm.
 */
const FieldErrorPair = ({
  leftMessage,
  rightMessage,
}: {
  leftMessage?: string;
  rightMessage?: string;
}) => {
  if (!leftMessage && !rightMessage) return null;
  return (
    <div className="grid gap-2 md:grid-cols-2 -mt-2">
      <FieldError message={leftMessage} />
      <FieldError message={rightMessage} />
    </div>
  );
};
