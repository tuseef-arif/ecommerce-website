import type { ReactNode, SelectHTMLAttributes } from "react";

export type SelectFieldOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectFieldVariant = "labeled" | "floating";
type SelectFieldSize = "sm" | "md";

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
  /**
   * Density for the floating variant. "md" (default) is form-sized; "sm" is a
   * compact filter-bar size that fits comfortably on mobile. Overrides the
   * native HTML `size` attribute, which is unused for our select markup.
   */
  size?: SelectFieldSize;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "size">;

const labeledFieldClass =
  "h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm leading-6 text-neutral-900 outline-none ring-0 transition-colors focus:border-[var(--store-brand-primary)] focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60";

const floatingFieldClassBySize: Record<SelectFieldSize, string> = {
  md: "peer min-h-[3.5rem] w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3 pr-10 pt-5 pb-1.5 text-sm leading-6 text-neutral-900 outline-none ring-0 transition-colors focus:border-[var(--store-brand-primary)] focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60",
  sm: "peer h-10 w-full appearance-none rounded-lg border border-neutral-300 bg-white px-2.5 pr-8 pt-3 pb-1 text-xs leading-5 text-neutral-900 outline-none ring-0 transition-colors focus:border-[var(--store-brand-primary)] focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 sm:px-3 sm:pr-9 sm:text-sm",
};

const floatingLabelClassBySize: Record<SelectFieldSize, string> = {
  md: "pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 bg-white px-1 text-sm text-neutral-500 transition-all duration-150 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:font-medium peer-focus:text-[var(--store-brand-primary)] peer-[:not(:invalid)]:top-0 peer-[:not(:invalid)]:-translate-y-1/2 peer-[:not(:invalid)]:text-xs peer-[:not(:invalid)]:font-medium peer-[:not(:invalid)]:text-neutral-600",
  sm: "pointer-events-none absolute left-2.5 top-0 z-[1] -translate-y-1/2 bg-white px-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-600 transition-colors duration-150 peer-focus:text-[var(--store-brand-primary)] sm:left-3",
};

const floatingChevronClassBySize: Record<SelectFieldSize, string> = {
  md: "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500",
  sm: "pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500 sm:right-3 sm:h-4 sm:w-4",
};

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
  size = "md",
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
            className={`${floatingFieldClassBySize[size]} ${className ?? ""}`.trim()}
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
          <span className={floatingLabelClassBySize[size]}>{label}</span>
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            className={floatingChevronClassBySize[size]}
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
