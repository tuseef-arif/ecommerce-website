"use client";

import { useId, useState, type InputHTMLAttributes } from "react";

type PasswordInputFieldProps = {
  label: string;
  name: string;
  wrapperClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

const defaultInputClassName =
  "peer h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 pb-1 pt-3 pr-12 text-sm leading-5 text-neutral-900 outline-none ring-0 transition-colors placeholder:text-transparent focus:border-[var(--store-brand-primary)] focus:ring-0";

const defaultLabelClassName =
  "pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 bg-white px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500 transition-all duration-150 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[10px] peer-focus:text-[var(--store-brand-primary)] peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-neutral-600";

export const PasswordInputField = ({
  label,
  name,
  wrapperClassName = "",
  labelClassName = defaultLabelClassName,
  inputClassName = defaultInputClassName,
  className,
  id,
  ...inputProps
}: PasswordInputFieldProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const generatedId = useId();
  const inputId = id ?? `${name}-${generatedId}`;

  return (
    <label className={`relative block ${wrapperClassName}`.trim()}>
      <input
        {...inputProps}
        id={inputId}
        name={name}
        type={isVisible ? "text" : "password"}
        placeholder=" "
        className={`${inputClassName} ${className ?? ""}`.trim()}
      />
      <button
        type="button"
        aria-label={isVisible ? "Hide password" : "Show password"}
        aria-pressed={isVisible}
        onClick={() => setIsVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 transition-colors hover:text-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
      >
        {isVisible ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              d="M3 3l18 18M10.6 10.6a2 2 0 102.8 2.8M9.9 5.1A10.7 10.7 0 0112 5c5.5 0 9.6 4.7 10.8 7-.7 1.3-2.3 3.7-4.7 5.4M6.4 6.4C3.9 8.2 2.2 10.8 1.2 12c.4.8 1.6 2.7 3.5 4.4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              d="M1.2 12S5.3 5 12 5s10.8 7 10.8 7-4.1 7-10.8 7S1.2 12 1.2 12z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="12"
              cy="12"
              r="3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            />
          </svg>
        )}
      </button>
      <span className={labelClassName}>{label}</span>
    </label>
  );
};
