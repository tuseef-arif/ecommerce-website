"use client";

import { useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { AdminProductSpecEntry } from "@/lib/products/admin-types";

type ProductSpecsEditorProps = {
  initialSpecs: ReadonlyArray<AdminProductSpecEntry>;
  /** Hidden field name for the JSON-serialised payload. */
  fieldName?: string;
  errorMessage?: string | null;
};

type EditableRow = AdminProductSpecEntry & { id: string };

const blankRow = (): EditableRow => ({
  id: `row-${Math.random().toString(36).slice(2)}`,
  key: "",
  value: "",
});

const seedRows = (
  initial: ReadonlyArray<AdminProductSpecEntry>,
): EditableRow[] => {
  if (initial.length === 0) return [blankRow()];
  return initial.map((entry, index) => ({
    id: `row-${index}-${entry.key}`,
    key: entry.key,
    value: entry.value,
  }));
};

export const ProductSpecsEditor = ({
  initialSpecs,
  fieldName = "specsJson",
  errorMessage,
}: ProductSpecsEditorProps) => {
  const groupId = useId();
  const [rows, setRows] = useState<EditableRow[]>(() => seedRows(initialSpecs));

  const serialized = useMemo(
    () =>
      JSON.stringify(
        rows
          .map((row) => ({ key: row.key.trim(), value: row.value.trim() }))
          .filter((row) => row.key.length > 0),
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
          Specifications
        </legend>
        <p className="text-xs text-neutral-500">
          Add key/value pairs (for example, “RAM” → “8 GB”). Empty rows are
          ignored on save.
        </p>
      </div>

      <input type="hidden" name={fieldName} value={serialized} />

      <ul className="mt-3 space-y-2">
        {rows.map((row) => (
          <li
            key={row.id}
            className={`grid gap-2 sm:items-center ${
              rows.length > 1
                ? "sm:grid-cols-[1fr_2fr_auto]"
                : "sm:grid-cols-[1fr_2fr]"
            }`}
          >
            <input
              type="text"
              value={row.key}
              onChange={(event) =>
                patchRow(row.id, { key: event.target.value })
              }
              placeholder="Key (e.g. RAM)"
              maxLength={80}
              className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-[var(--store-brand-primary)]"
            />
            <input
              type="text"
              value={row.value}
              onChange={(event) =>
                patchRow(row.id, { value: event.target.value })
              }
              placeholder="Value (e.g. 8 GB)"
              maxLength={500}
              className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-[var(--store-brand-primary)]"
            />
            {rows.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeRow(row.id)}
                className="justify-self-start sm:justify-self-end"
                aria-label="Remove spec row"
              >
                Remove
              </Button>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="mt-3">
        <Button type="button" variant="secondary" size="sm" onClick={addRow}>
          + Add spec
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
