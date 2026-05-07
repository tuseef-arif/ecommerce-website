import type { SVGProps } from "react";

export const IconMoney = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={20}
    height={20}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    {...props}
  >
    <rect x="3" y="6.5" width="18" height="11" rx="2" />
    <path d="M3 10.5c1.6 0 3-1.4 3-4" />
    <path d="M21 10.5c-1.6 0-3-1.4-3-4" />
    <path d="M3 13.5c1.6 0 3 1.4 3 4" />
    <path d="M21 13.5c-1.6 0-3 1.4-3 4" />
    <circle cx="12" cy="12" r="2.2" />
  </svg>
);
