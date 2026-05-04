import type { SVGProps } from "react";

/** Filled success check; set `className` (e.g. `text-emerald-600`) for color. */
export const IconCheckCircleFilled = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={28}
    height={28}
    fill="currentColor"
    aria-hidden
    {...props}
  >
    <path
      fillRule="evenodd"
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
      clipRule="evenodd"
    />
  </svg>
);
