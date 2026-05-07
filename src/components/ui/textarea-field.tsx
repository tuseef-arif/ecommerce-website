import type { ReactNode, TextareaHTMLAttributes } from "react";

type TextareaFieldVariant = "labeled" | "floating";

type TextareaFieldProps = {
  label: string;
  name: string;
  error?: string | null;
  hint?: ReactNode;
  wrapperClassName?: string;
  /**
   * "labeled" (default): small uppercase label above the textarea.
   * "floating": label sits inside the textarea at rest and floats above the
   *   border on focus or when there is content (matches FormInputField).
   */
  variant?: TextareaFieldVariant;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

const labeledFieldClass =
  "min-h-24 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none ring-0 transition-colors focus:border-[var(--store-brand-primary)] focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60";

const floatingFieldClass =
  "peer min-h-28 w-full rounded-lg border border-neutral-300 bg-white px-3 pt-5 pb-2.5 text-sm leading-relaxed text-neutral-900 outline-none ring-0 transition-colors placeholder:text-transparent focus:border-[var(--store-brand-primary)] focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60";

const floatingLabelClass =
  "pointer-events-none absolute left-3 top-3 bg-white px-1 text-sm text-neutral-500 transition-all duration-150 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:font-medium peer-focus:text-[var(--store-brand-primary)] peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-medium peer-[:not(:placeholder-shown)]:text-neutral-600";

export const TextareaField = ({
  label,
  name,
  error,
  hint,
  id,
  wrapperClassName = "",
  className,
  rows = 4,
  variant = "labeled",
  placeholder,
  ...rest
}: TextareaFieldProps) => {
  const fieldId = id ?? name;
  const describedById = error
    ? `${fieldId}-error`
    : hint
      ? `${fieldId}-hint`
      : undefined;

  if (variant === "floating") {
    return (
      <div className={`flex flex-col gap-1.5 ${wrapperClassName}`.trim()}>
        <label htmlFor={fieldId} className="relative block">
          <textarea
            {...rest}
            id={fieldId}
            name={name}
            rows={rows}
            placeholder=" "
            aria-invalid={error ? true : undefined}
            aria-describedby={describedById}
            className={`${floatingFieldClass} ${className ?? ""}`.trim()}
          />
          <span className={floatingLabelClass}>{label}</span>
        </label>
        {error ? (
          <p
            id={`${fieldId}-error`}
            className="text-xs text-red-600"
            role="alert"
          >
            {error}
          </p>
        ) : hint ? (
          <p id={`${fieldId}-hint`} className="text-xs text-neutral-500">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1.5 ${wrapperClassName}`.trim()}>
      <label
        htmlFor={fieldId}
        className="text-xs font-semibold uppercase tracking-wide text-neutral-600"
      >
        {label}
      </label>
      <textarea
        {...rest}
        id={fieldId}
        name={name}
        rows={rows}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedById}
        className={`${labeledFieldClass} ${className ?? ""}`.trim()}
      />
      {error ? (
        <p
          id={`${fieldId}-error`}
          className="text-xs text-red-600"
          role="alert"
        >
          {error}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="text-xs text-neutral-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
};
