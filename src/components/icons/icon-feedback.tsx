import type { SVGProps } from "react";

export const IconFeedback = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M5.5 4h13A2.5 2.5 0 0 1 21 6.5v9a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4H5.5A2.5 2.5 0 0 1 3 15.5v-9A2.5 2.5 0 0 1 5.5 4Z" />
    <path d="M8 9.5h8" />
    <path d="M8 13.5h8" />
  </svg>
);
