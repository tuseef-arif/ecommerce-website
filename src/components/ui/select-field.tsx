import type { ReactNode, SelectHTMLAttributes } from "react";

export type SelectFieldOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectFieldVariant = "labeled" | "floating";

type SelectFieldProps = {
  label: string;
  name: string;
  options: ReadonlyArray<SelectFieldOption>;
  placeholder?: string;
  error?: string | null;
  hint?: ReactNode;
  wrapperClassName?: string;
  /**
   * "labeled" (default): small uppercase label above the field.
   * "floating": floating label that sits inside the control and rises on focus
   *   or when a non-empty option is selected. Requires `required` to detect the
   *   empty state via `:invalid`.
   */
  variant?: SelectFieldVariant;
} & SelectHTMLAttributes<HTMLSelectElement>;

const labeledFieldClass =
  "h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm leading-6 text-neutral-900 outline-none ring-0 transition-colors focus:border-[var(--store-brand-primary)] focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60";

const floatingFieldClass =
  "peer min-h-[3.5rem] w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3 pr-10 pt-5 pb-1.5 text-sm leading-6 text-neutral-900 outline-none ring-0 transition-colors focus:border-[var(--store-brand-primary)] focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60";

const floatingLabelClass =
  "pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 bg-white px-1 text-sm text-neutral-500 transition-all duration-150 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:font-medium peer-focus:text-[var(--store-brand-primary)] peer-[:not(:invalid)]:top-0 peer-[:not(:invalid)]:-translate-y-1/2 peer-[:not(:invalid)]:text-xs peer-[:not(:invalid)]:font-medium peer-[:not(:invalid)]:text-neutral-600";

export const SelectField = ({
  label,
  name,
  options,
  placeholder,
  error,
  hint,
  id,
  wrapperClassName = "",
  className,
  variant = "labeled",
  required,
  ...rest
}: SelectFieldProps) => {
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
          <select
            {...rest}
            id={fieldId}
            name={name}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedById}
            className={`${floatingFieldClass} ${className ?? ""}`.trim()}
          >
            {placeholder ? (
              <option value="" disabled={required}>
                {placeholder}
              </option>
            ) : null}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <span className={floatingLabelClass}>{label}</span>
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
          >
            <path
              d="M5.5 7.5l4.5 4.5 4.5-4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
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
      <select
        {...rest}
        id={fieldId}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedById}
        className={`${labeledFieldClass} ${className ?? ""}`.trim()}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
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
