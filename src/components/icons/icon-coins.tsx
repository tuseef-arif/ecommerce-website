import type { SVGProps } from "react";

export const IconCoins = (props: SVGProps<SVGSVGElement>) => (
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
    <ellipse cx="12" cy="6" rx="7" ry="3" />
    <path d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6" />
    <path d="M5 12v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" />
  </svg>
);
