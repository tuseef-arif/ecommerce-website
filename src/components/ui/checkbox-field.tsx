import type { InputHTMLAttributes, ReactNode } from "react";

type CheckboxFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label: ReactNode;
  labelClassName?: string;
  inputClassName?: string;
};

export const CheckboxField = ({
  label,
  className,
  labelClassName = "",
  inputClassName = "",
  ...rest
}: CheckboxFieldProps) => {
  const wrapperClass = [
    "group inline-flex cursor-pointer items-center gap-2 text-sm text-neutral-700",
    className ?? "",
    labelClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const checkboxClass = [
    "sr-only shrink-0",
    "focus-visible:outline-none",
    "enabled:focus-visible:ring-2 enabled:focus-visible:ring-[#fe9922] enabled:focus-visible:ring-offset-2",
    inputClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <label className={wrapperClass}>
      <input type="checkbox" className={checkboxClass} {...rest} />
      <span
        aria-hidden
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-neutral-300 bg-white transition-colors group-has-[:checked]:border-[#fe9922] group-has-[:checked]:bg-[#fe9922]"
      >
        <span className="text-xs font-bold leading-none text-white opacity-0 transition-opacity group-has-[:checked]:opacity-100">
          ✓
        </span>
      </span>
      {label}
    </label>
  );
};
