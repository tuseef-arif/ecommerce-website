import type { SVGProps } from "react";

export const IconChevronRight = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={20}
    height={20}
    fill="none"
    stroke="currentColor"
    strokeWidth={2.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    {...props}
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);
