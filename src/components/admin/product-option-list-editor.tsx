"use client";

import { useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SITE_PRODUCT_FORM } from "@/lib/config/site-config";

type ProductOptionListEditorProps = {
  /** Hidden input name — must match what the server action reads. */
  fieldName: string;
  /** Section legend (e.g. "Color options"). */
  legend: string;
  /** Helper copy under the legend. */
  helperText: string;
  /** Placeholder for each row. */
  rowPlaceholder: string;
  /** Label for the "+ add" button. */
  addCtaLabel: string;
  /** Pre-populated values when editing. */
  initialValues?: ReadonlyArray<string>;
  /** Validation error from the server action, if any. */
  errorMessage?: string | null;
  /** Per-entry max length (matches `parseStringListJsonInput`). */
  maxLength?: number;
};

type EditableRow = { id: string; value: string };

const blankRow = (): EditableRow => ({
  id: `row-${Math.random().toString(36).slice(2)}`,
  value: "",
});

const seedRows = (initial: ReadonlyArray<string>): EditableRow[] => {
  if (initial.length === 0) return [blankRow()];
  return initial.map((value, index) => ({
    id: `row-${index}-${value}`,
    value,
  }));
};

/**
 * Generic admin editor for a list of strings (color names, storage variants,
 * etc.). Serialises to a JSON `string[]` in a hidden input so the server
 * action can parse with `parseStringListJsonInput`.
 *
 * - Empty rows are dropped from the serialised payload.
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
        rows.map((row) => row.value.trim()).filter((value) => value.length > 0),
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
      </div>

      <input type="hidden" name={fieldName} value={serialized} />

      <ul className="mt-3 space-y-2">
        {rows.map((row) => (
          <li
            key={row.id}
            className={`grid gap-2 sm:items-center ${
              rows.length > 1 ? "sm:grid-cols-[1fr_auto]" : "sm:grid-cols-[1fr]"
            }`}
          >
            <input
              type="text"
              value={row.value}
              onChange={(event) =>
                patchRow(row.id, { value: event.target.value })
              }
              placeholder={rowPlaceholder}
              maxLength={maxLength}
              className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-[var(--store-brand-primary)]"
            />
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
            ) : null}
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
