"use client";

import type { ReactNode } from "react";
import { useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormInputField } from "@/components/ui/form-input-field";
import { SelectField } from "@/components/ui/select-field";
import type { AdminOrderProductOption } from "@/lib/orders/admin-types";
import type { AdminProductCategoryOption } from "@/lib/products/admin-types";
import { formatProductPriceAmount } from "@/lib/products/format-price";
import type { ProductVariantOption } from "@/lib/products/specs";
import type { OrderItemInput } from "@/lib/orders/admin-schemas";

type OrderItemsEditorProps = {
  /**
   * Active products (already enriched with category + variant options) the
   * admin can sell. The category comes from each product, so the editor
   * doesn't need a separate categories prop — it derives them from this
   * list to guarantee every category shown is sellable.
   *
   * Optional fallback `categories` prop is accepted for parity with the
   * product form's data shape; if supplied, it's intersected with the set
   * of categories represented in `products`.
   */
  products: ReadonlyArray<AdminOrderProductOption>;
  /**
   * Optional override for the category dropdown. When omitted, categories
   * are derived from the unique categories present in `products`.
   */
  categories?: ReadonlyArray<AdminProductCategoryOption>;
  /** Hidden field name for the JSON-serialised payload. */
  fieldName?: string;
  /** Currency prefix shown alongside totals (e.g. "Rs"). */
  currencyPrefix?: string;
  errorMessage?: string | null;
  /** Shown at the top of the card above the "Order items" heading (e.g. customer + status). */
  leadFields?: ReactNode;
  /** Optional initial rows for edit mode. */
  initialItems?: ReadonlyArray<OrderItemInput>;
  /** Existing reserved quantities to allow in edit mode stock checks. */
  stockAllowanceByProductId?: Readonly<Record<string, number>>;
};

type EditableRow = {
  id: string;
  categoryId: string;
  productId: string;
  selectedColor: string;
  selectedStorage: string;
  quantity: number;
};

/** Stable SSR/hydration-safe row id — never use Math.random in initial UI state. */
const INITIAL_ORDER_ITEM_ROW_ID = "order-item-row-0";

const createInitialRow = (): EditableRow => ({
  id: INITIAL_ORDER_ITEM_ROW_ID,
  categoryId: "",
  productId: "",
  selectedColor: "",
  selectedStorage: "",
  quantity: 1,
});

/** Only call from event handlers (after mount). Not used for initial SSR state. */
const blankRowAfterMount = (): EditableRow => ({
  id:
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `order-item-row-${crypto.randomUUID()}`
      : `order-item-row-${Date.now()}`,
  categoryId: "",
  productId: "",
  selectedColor: "",
  selectedStorage: "",
  quantity: 1,
});

const formatMoney = (value: number): string =>
  Number.isFinite(value)
    ? value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";

/** Build the option label, appending `(+Rs N)` when the variant has a delta. */
const buildVariantOptionLabel = (
  option: ProductVariantOption,
  currencyPrefix: string,
): string => {
  if (option.priceDelta <= 0) return option.value;
  return `${option.value} (+${currencyPrefix} ${formatProductPriceAmount(
    option.priceDelta,
  )})`;
};

const findVariantDelta = (
  options: ReadonlyArray<ProductVariantOption>,
  value: string,
): number => {
  if (value.length === 0) return 0;
  const match = options.find((option) => option.value === value);
  return match ? match.priceDelta : 0;
};

/**
 * Tailwind override applied to a SelectField/FormInputField when the row is
 * incomplete. Comes after the component's default `border-neutral-300`, so
 * later cascade wins; the focus ring also turns red so it stays consistent
 * while the admin is still editing.
 */
const ERROR_FIELD_CLASS =
  "border-red-500 focus:border-red-500 focus-visible:outline-red-500";

type RowFieldErrors = {
  product?: string;
  color?: string;
  storage?: string;
  quantity?: string;
};

/**
 * Live row-level validation. Only flags rows the admin has started (i.e.
 * picked a category or a product) so freshly added blank rows stay quiet
 * until the admin engages with them.
 *
 * Returns an empty object when there's nothing to flag — that lets the
 * caller cheaply skip rendering the error UI.
 */
const computeRowErrors = (
  row: EditableRow,
  product: AdminOrderProductOption | undefined,
  totalRequestedForProduct: number,
  stockAllowanceForProduct: number,
): RowFieldErrors => {
  const isStarted = row.categoryId.length > 0 || row.productId.length > 0;
  if (!isStarted) return {};

  const errors: RowFieldErrors = {};

  if (row.productId.length === 0) {
    errors.product = "Pick a product.";
    return errors;
  }
  if (!product) return errors;

  if (product.colorOptions.length > 0 && row.selectedColor.length === 0) {
    errors.color = "Pick a color.";
  }
  if (product.storageOptions.length > 0 && row.selectedStorage.length === 0) {
    errors.storage = "Pick a storage option.";
  }
  const availableStock = product.stock + stockAllowanceForProduct;
  if (totalRequestedForProduct > availableStock) {
    errors.quantity = `Exceeds stock (${availableStock}).`;
  }

  return errors;
};

export const OrderItemsEditor = ({
  products,
  categories,
  fieldName = "itemsJson",
  currencyPrefix = "Rs",
  errorMessage,
  leadFields,
  initialItems,
  stockAllowanceByProductId,
}: OrderItemsEditorProps) => {
  const groupId = useId();
  const [rows, setRows] = useState<EditableRow[]>(() => {
    if (!initialItems || initialItems.length === 0) return [createInitialRow()];

    return initialItems.map((item, index) => {
      const product = products.find(
        (candidate) => candidate.id === item.productId,
      );
      return {
        id: `order-item-row-initial-${index}`,
        categoryId: product?.category.id ?? "",
        productId: item.productId,
        selectedColor: item.selectedColor ?? "",
        selectedStorage: item.selectedStorage ?? "",
        quantity: item.quantity,
      };
    });
  });

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const requestedQtyByProductId = useMemo(() => {
    const totals = new Map<string, number>();
    for (const row of rows) {
      if (row.productId.length === 0) continue;
      totals.set(
        row.productId,
        (totals.get(row.productId) ?? 0) + Math.max(0, row.quantity),
      );
    }
    return totals;
  }, [rows]);

  /**
   * Categories drawn from sellable products only. If a `categories` prop is
   * provided, we intersect with it so the editor never shows categories that
   * have no active products — keeping the dropdown actionable.
   */
  const categoryOptions = useMemo(() => {
    const seen = new Map<string, AdminProductCategoryOption>();
    for (const product of products) {
      if (!seen.has(product.category.id)) {
        seen.set(product.category.id, {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        });
      }
    }
    let derived = Array.from(seen.values());
    if (categories && categories.length > 0) {
      const allowed = new Set(categories.map((category) => category.id));
      derived = derived.filter((category) => allowed.has(category.id));
    }
    derived.sort((a, b) => a.name.localeCompare(b.name));
    return derived;
  }, [products, categories]);

  /** Filled rows shaped for the server action; empty product rows are dropped. */
  const filledRows = useMemo(
    () =>
      rows
        .filter((row) => row.productId.length > 0 && row.quantity > 0)
        .map((row) => ({
          productId: row.productId,
          quantity: row.quantity,
          selectedColor:
            row.selectedColor.length > 0 ? row.selectedColor : null,
          selectedStorage:
            row.selectedStorage.length > 0 ? row.selectedStorage : null,
        })),
    [rows],
  );

  const serialized = useMemo(() => JSON.stringify(filledRows), [filledRows]);

  const totals = useMemo(() => {
    let subtotal = 0;
    let total = 0;
    for (const row of rows) {
      const product = productById.get(row.productId);
      if (!product) continue;
      const unitPrice = Number.parseFloat(product.unitPrice);
      const final = Number.parseFloat(product.finalPrice);
      const colorDelta = findVariantDelta(
        product.colorOptions,
        row.selectedColor,
      );
      const storageDelta = findVariantDelta(
        product.storageOptions,
        row.selectedStorage,
      );
      if (Number.isFinite(unitPrice)) {
        subtotal += (unitPrice + colorDelta + storageDelta) * row.quantity;
      }
      if (Number.isFinite(final)) {
        total += (final + colorDelta + storageDelta) * row.quantity;
      }
    }
    const discount = Math.max(0, subtotal - total);
    return { subtotal, discount, total };
  }, [rows, productById]);

  const addRow = () => setRows((prev) => [...prev, blankRowAfterMount()]);

  const removeRow = (id: string) =>
    setRows((prev) =>
      prev.length === 1
        ? [createInitialRow()]
        : prev.filter((row) => row.id !== id),
    );

  const patchRow = (id: string, patch: Partial<EditableRow>) =>
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );

  /** Switching category clears the product + variant choices so the next
   * dropdown only shows products in the new category. */
  const handleCategoryChange = (rowId: string, nextCategoryId: string) =>
    patchRow(rowId, {
      categoryId: nextCategoryId,
      productId: "",
      selectedColor: "",
      selectedStorage: "",
    });

  /** Switching product resets its variant selections to the first available
   * option (so the row is immediately submittable). */
  const handleProductChange = (rowId: string, nextProductId: string) => {
    const next = productById.get(nextProductId);
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        return {
          ...row,
          productId: nextProductId,
          selectedColor: next?.colorOptions[0]?.value ?? "",
          selectedStorage: next?.storageOptions[0]?.value ?? "",
        };
      }),
    );
  };

  return (
    <fieldset
      aria-labelledby={`${groupId}-label`}
      className="rounded-2xl border border-neutral-200 bg-white p-4"
    >
      {leadFields ? (
        <div className="mb-4 border-b border-neutral-100 pb-4">
          {leadFields}
        </div>
      ) : null}
      <div className="flex flex-col gap-1">
        <legend
          id={`${groupId}-label`}
          className="text-xs font-semibold uppercase tracking-wide text-neutral-600"
        >
          Order items
        </legend>
        <p className="text-xs text-neutral-500">
          Pick a category to narrow the product list. Color and storage
          dropdowns appear only when the chosen product offers them; their extra
          cost is added on top of the discounted price.
        </p>
      </div>

      <input type="hidden" name={fieldName} value={serialized} />

      <ul className="mt-3 space-y-4">
        {rows.map((row) => {
          const product = productById.get(row.productId);

          const productsInCategory = row.categoryId
            ? products.filter((p) => p.category.id === row.categoryId)
            : products;

          const productOptions = productsInCategory.map((p) => ({
            value: p.id,
            label: `${p.brand} · ${p.name} (stock ${p.stock})`,
          }));

          const colorOptions = product?.colorOptions ?? [];
          const storageOptions = product?.storageOptions ?? [];
          const hasColors = colorOptions.length > 0;
          const hasStorages = storageOptions.length > 0;

          const colorDelta = findVariantDelta(colorOptions, row.selectedColor);
          const storageDelta = findVariantDelta(
            storageOptions,
            row.selectedStorage,
          );
          const discountedUnit = product
            ? Number.parseFloat(product.finalPrice)
            : null;
          const lineTotal =
            discountedUnit !== null && Number.isFinite(discountedUnit)
              ? (discountedUnit + colorDelta + storageDelta) * row.quantity
              : null;

          const totalRequestedForProduct =
            requestedQtyByProductId.get(row.productId) ?? 0;
          const stockAllowanceForProduct =
            (row.productId &&
              (stockAllowanceByProductId?.[row.productId] ?? 0)) ||
            0;
          const rowErrors = computeRowErrors(
            row,
            product,
            totalRequestedForProduct,
            stockAllowanceForProduct,
          );

          return (
            <li
              key={row.id}
              className="rounded-xl border border-neutral-200 bg-neutral-50/40 p-3"
            >
              <div className="grid items-start gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
                <SelectField
                  label="Category"
                  name={`order-item-category-${row.id}`}
                  variant="floating"
                  size="sm"
                  wrapperClassName="w-full"
                  value={row.categoryId}
                  onChange={(event) =>
                    handleCategoryChange(row.id, event.currentTarget.value)
                  }
                  options={categoryOptions.map((category) => ({
                    value: category.id,
                    label: category.name,
                  }))}
                  placeholder={
                    categoryOptions.length === 0
                      ? "No categories available"
                      : "All categories"
                  }
                />

                <SelectField
                  label="Product"
                  name={`order-item-product-${row.id}`}
                  variant="floating"
                  size="sm"
                  wrapperClassName="w-full"
                  value={row.productId}
                  onChange={(event) =>
                    handleProductChange(row.id, event.currentTarget.value)
                  }
                  options={productOptions}
                  placeholder={
                    productOptions.length === 0
                      ? "No products in this category"
                      : "Select a product…"
                  }
                  className={rowErrors.product ? ERROR_FIELD_CLASS : undefined}
                  error={rowErrors.product ?? null}
                />

                {hasColors ? (
                  <SelectField
                    label="Color"
                    name={`order-item-color-${row.id}`}
                    variant="floating"
                    size="sm"
                    wrapperClassName="w-full"
                    value={row.selectedColor}
                    onChange={(event) =>
                      patchRow(row.id, {
                        selectedColor: event.currentTarget.value,
                      })
                    }
                    options={colorOptions.map((option) => ({
                      value: option.value,
                      label: buildVariantOptionLabel(option, currencyPrefix),
                    }))}
                    className={rowErrors.color ? ERROR_FIELD_CLASS : undefined}
                    error={rowErrors.color ?? null}
                  />
                ) : (
                  <div aria-hidden className="hidden lg:block" />
                )}

                {hasStorages ? (
                  <SelectField
                    label="Storage"
                    name={`order-item-storage-${row.id}`}
                    variant="floating"
                    size="sm"
                    wrapperClassName="w-full"
                    value={row.selectedStorage}
                    onChange={(event) =>
                      patchRow(row.id, {
                        selectedStorage: event.currentTarget.value,
                      })
                    }
                    options={storageOptions.map((option) => ({
                      value: option.value,
                      label: buildVariantOptionLabel(option, currencyPrefix),
                    }))}
                    className={
                      rowErrors.storage ? ERROR_FIELD_CLASS : undefined
                    }
                    error={rowErrors.storage ?? null}
                  />
                ) : (
                  <div aria-hidden className="hidden lg:block" />
                )}
              </div>

              {/* Mirrors the Row 1 grid template so Quantity lines up exactly
                  under Category; Line Total + Remove cluster sits in the
                  remaining 3 columns, right-aligned. */}
              <div className="mt-3 grid items-start gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
                <div className="w-full">
                  <FormInputField
                    label="Quantity"
                    name={`order-item-quantity-${row.id}`}
                    type="number"
                    wrapperClassName="w-full"
                    min={1}
                    step={1}
                    value={row.quantity}
                    onChange={(event) => {
                      const next = Number.parseInt(event.target.value, 10);
                      patchRow(row.id, {
                        quantity: Number.isFinite(next) && next > 0 ? next : 1,
                      });
                    }}
                    aria-invalid={rowErrors.quantity ? true : undefined}
                    className={
                      rowErrors.quantity ? ERROR_FIELD_CLASS : undefined
                    }
                  />
                  {rowErrors.quantity ? (
                    <p className="mt-1 text-xs text-red-600" role="alert">
                      {rowErrors.quantity}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center justify-end gap-3 text-right lg:col-span-3">
                  <p className="text-sm text-neutral-500">Line Total</p>
                  <p className="font-mono text-sm font-semibold text-neutral-900">
                    {currencyPrefix}{" "}
                    {lineTotal === null ? "—" : formatMoney(lineTotal)}
                  </p>
                  {rows.length > 1 ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      onClick={() => removeRow(row.id)}
                      aria-label="Remove order item row"
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <Button type="button" variant="secondary" size="sm" onClick={addRow}>
          + Add product
        </Button>

        <dl className="grid w-[18rem] grid-cols-[auto_auto] items-center justify-end gap-x-3 gap-y-1 text-sm">
          <dt className="text-neutral-500">Subtotal</dt>
          <dd className="text-right font-mono tabular-nums text-neutral-900">
            {currencyPrefix} {formatMoney(totals.subtotal)}
          </dd>
          <dt className="text-neutral-500">Discount</dt>
          <dd className="text-right font-mono tabular-nums text-neutral-900">
            − {currencyPrefix} {formatMoney(totals.discount)}
          </dd>
          <dt className="font-semibold text-neutral-700">Total</dt>
          <dd className="text-right font-mono font-semibold tabular-nums text-neutral-900">
            {currencyPrefix} {formatMoney(totals.total)}
          </dd>
        </dl>
      </div>

      {errorMessage ? (
        <p
          role="alert"
          className="mt-3 rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700"
        >
          {errorMessage}
        </p>
      ) : null}
    </fieldset>
  );
};
