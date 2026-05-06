import type { InputHTMLAttributes, RefObject } from "react";

type FormInputFieldProps = {
  label: string;
  name: string;
  wrapperClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
} & InputHTMLAttributes<HTMLInputElement>;

const defaultInputClassName =
  "peer h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 pb-1 pt-3 text-sm leading-5 text-neutral-900 outline-none ring-0 transition-colors placeholder:text-transparent focus:border-[var(--store-brand-primary)] focus:ring-0";

export const FormInputField = ({
  label,
  name,
  type = "text",
  wrapperClassName = "",
  labelClassName = "pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 bg-white px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500 transition-all duration-150 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[10px] peer-focus:text-[var(--store-brand-primary)] peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-neutral-600",
  inputClassName = defaultInputClassName,
  inputRef,
  className,
  id,
  ...inputProps
}: FormInputFieldProps) => (
  <label className={`relative block ${wrapperClassName}`.trim()}>
    <input
      {...inputProps}
      ref={inputRef}
      id={id ?? name}
      name={name}
      type={type}
      placeholder=" "
      className={`${inputClassName} ${className ?? ""}`.trim()}
    />
    <span className={labelClassName}>{label}</span>
  </label>
);
