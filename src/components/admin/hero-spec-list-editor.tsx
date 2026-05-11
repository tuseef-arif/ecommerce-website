"use client";

import { useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  HERO_SLIDE_SPEC_MAX_COUNT,
  HERO_SLIDE_SPEC_MAX_LENGTH,
} from "@/lib/hero/admin-schemas";

type HeroSpecListEditorProps = {
  /** Hidden input name read by the server action. */
  fieldName?: string;
  /** Existing bullet lines when editing. */
  initialValues?: ReadonlyArray<string>;
  /** Validation error from the server action, if any. */
  errorMessage?: string | null;
};

type EditableRow = {
  id: string;
  value: string;
};

const generateRowId = () => `row-${Math.random().toString(36).slice(2)}`;

const blankRow = (): EditableRow => ({ id: generateRowId(), value: "" });

const seedRows = (initial: ReadonlyArray<string>): EditableRow[] => {
  if (initial.length === 0) return [blankRow()];
  return initial.map((value) => ({ id: generateRowId(), value }));
};

/**
 * Editor for the hero slide bullet list. Each row is one bullet line;
 * empty rows are dropped from the serialised JSON payload that the server
 * action validates with `parseHeroSpecsJsonInput`.
 */
export const HeroSpecListEditor = ({
  fieldName = "specsJson",
  initialValues = [],
  errorMessage,
}: HeroSpecListEditorProps) => {
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

  const canAdd = rows.length < HERO_SLIDE_SPEC_MAX_COUNT;

  const addRow = () => {
    if (!canAdd) return;
    setRows((prev) => [...prev, blankRow()]);
  };

  const removeRow = (id: string) =>
    setRows((prev) =>
      prev.length === 1 ? [blankRow()] : prev.filter((row) => row.id !== id),
    );

  const patchRow = (id: string, value: string) =>
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, value } : row)),
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
          Spec bullets
        </legend>
        <p className="text-xs text-neutral-500">
          One short line per bullet. Up to {HERO_SLIDE_SPEC_MAX_COUNT} lines,{" "}
          {HERO_SLIDE_SPEC_MAX_LENGTH} characters each.
        </p>
      </div>

      <input type="hidden" name={fieldName} value={serialized} />

      <ul className="mt-3 space-y-2">
        {rows.map((row, index) => (
          <li
            key={row.id}
            className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center"
          >
            <input
              type="text"
              value={row.value}
              onChange={(event) => patchRow(row.id, event.target.value)}
              placeholder={`Spec line ${index + 1}`}
              maxLength={HERO_SLIDE_SPEC_MAX_LENGTH}
              aria-label={`Spec line ${index + 1}`}
              className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-[var(--store-brand-primary)]"
            />

            {rows.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeRow(row.id)}
                className="justify-self-start sm:justify-self-end"
                aria-label={`Remove spec line ${index + 1}`}
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
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={addRow}
          disabled={!canAdd}
        >
          + Add spec line
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
