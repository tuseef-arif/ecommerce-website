"use client";

import { useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  SITE_PRODUCT_FORM,
  SITE_PRODUCT_SLIDER,
} from "@/lib/config/site-config";
import type { ProductVariantOption } from "@/lib/products/specs";

type ProductOptionListEditorProps = {
  /** Hidden input name — must match what the server action reads. */
  fieldName: string;
  /** Section legend (e.g. "Color options"). */
  legend: string;
  /** Helper copy under the legend. */
  helperText: string;
  /** Placeholder for each row's value input. */
  rowPlaceholder: string;
  /** Label for the "+ add" button. */
  addCtaLabel: string;
  /**
   * Pre-populated values when editing. Accepts both the new
   * `ProductVariantOption[]` shape and the legacy `string[]` shape so the
   * caller can pass admin-detail data straight in.
   */
  initialValues?: ReadonlyArray<ProductVariantOption | string>;
  /** Validation error from the server action, if any. */
  errorMessage?: string | null;
  /** Per-entry max length (matches `parseVariantListJsonInput`). */
  maxLength?: number;
};

type EditableRow = {
  id: string;
  value: string;
  /** Stored as the editor's raw string so we don't lose digits on blur. */
  priceDeltaRaw: string;
};

const blankRow = (): EditableRow => ({
  id: `row-${Math.random().toString(36).slice(2)}`,
  value: "",
  priceDeltaRaw: "",
});

const seedRows = (
  initial: ReadonlyArray<ProductVariantOption | string>,
): EditableRow[] => {
  if (initial.length === 0) return [blankRow()];
  return initial.map((entry, index) => {
    if (typeof entry === "string") {
      return {
        id: `row-${index}-${entry}`,
        value: entry,
        priceDeltaRaw: "",
      };
    }
    return {
      id: `row-${index}-${entry.value}`,
      value: entry.value,
      priceDeltaRaw:
        entry.priceDelta && entry.priceDelta > 0
          ? String(entry.priceDelta)
          : "",
    };
  });
};

/**
 * Generic admin editor for a list of product variant options (color names,
 * storage variants, etc.). Each row captures a free-text value and an
 * optional non-negative `priceDelta` that the storefront adds to the base
 * product price when the shopper selects this option.
 *
 * Serialises to a JSON `ProductVariantOption[]` in a hidden input so the
 * server action can validate with `parseVariantListJsonInput`.
 *
 * - Rows whose value is empty are dropped from the serialised payload.
 * - Always keeps at least one row visible so the form is never "empty-looking".
 * - Generic on purpose; spec-specific labels/placeholders come in via props.
 */
export const ProductOptionListEditor = ({
  fieldName,
  legend,
  helperText,
  rowPlaceholder,
  addCtaLabel,
  initialValues = [],
  errorMessage,
  maxLength = 64,
}: ProductOptionListEditorProps) => {
  const groupId = useId();
  const [rows, setRows] = useState<EditableRow[]>(() =>
    seedRows(initialValues),
  );

  const serialized = useMemo(
    () =>
      JSON.stringify(
        rows
          .map((row) => {
            const value = row.value.trim();
            if (value.length === 0) return null;
            const parsedDelta = Number.parseFloat(row.priceDeltaRaw);
            const priceDelta =
              Number.isFinite(parsedDelta) && parsedDelta > 0
                ? Math.round(parsedDelta * 100) / 100
                : 0;
            return { value, priceDelta };
          })
          .filter(
            (entry): entry is { value: string; priceDelta: number } =>
              entry !== null,
          ),
      ),
    [rows],
  );

  const addRow = () => setRows((prev) => [...prev, blankRow()]);

  const removeRow = (id: string) =>
    setRows((prev) =>
      prev.length === 1 ? [blankRow()] : prev.filter((row) => row.id !== id),
    );

  const patchRow = (id: string, patch: Partial<EditableRow>) =>
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );

  const deltaPrefix = SITE_PRODUCT_SLIDER.pricePrefix;

  return (
    <fieldset
      aria-labelledby={`${groupId}-label`}
      className="rounded-2xl border border-neutral-200 bg-white p-4"
    >
      <div className="flex flex-col gap-1">
        <legend
          id={`${groupId}-label`}
          className="text-xs font-semibold uppercase tracking-wide text-neutral-600"
        >
          {legend}
        </legend>
        <p className="text-xs text-neutral-500">{helperText}</p>
        <p className="text-xs text-neutral-500">
          {SITE_PRODUCT_FORM.optionDeltaHelper}
        </p>
      </div>

      <input type="hidden" name={fieldName} value={serialized} />

      <ul className="mt-3 space-y-2">
        {rows.map((row) => (
          <li
            key={row.id}
            className="grid gap-2 sm:items-center sm:grid-cols-[1fr_140px_auto]"
          >
            <input
              type="text"
              value={row.value}
              onChange={(event) =>
                patchRow(row.id, { value: event.target.value })
              }
              placeholder={rowPlaceholder}
              maxLength={maxLength}
              aria-label={legend}
              className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-[var(--store-brand-primary)]"
            />

            <label className="relative block">
              <span className="sr-only">
                {SITE_PRODUCT_FORM.optionDeltaSrLabel}
              </span>
              <span
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-500"
                aria-hidden
              >
                + {deltaPrefix}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={row.priceDeltaRaw}
                onChange={(event) =>
                  patchRow(row.id, { priceDeltaRaw: event.target.value })
                }
                placeholder="0"
                aria-label={`${legend} ${SITE_PRODUCT_FORM.optionDeltaSrLabel}`}
                className="h-10 w-full rounded-lg border border-neutral-300 bg-white pl-12 pr-3 text-right text-sm tabular-nums text-neutral-900 outline-none transition-colors focus:border-[var(--store-brand-primary)]"
              />
            </label>

            {rows.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeRow(row.id)}
                className="justify-self-start sm:justify-self-end"
                aria-label={SITE_PRODUCT_FORM.optionRowRemoveAria}
              >
                Remove
              </Button>
            ) : (
              <span aria-hidden className="hidden sm:block" />
            )}
          </li>
        ))}
      </ul>

      <div className="mt-3">
        <Button type="button" variant="secondary" size="sm" onClick={addRow}>
          {addCtaLabel}
        </Button>
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
