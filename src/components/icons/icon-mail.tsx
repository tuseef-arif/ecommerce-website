import type { SVGProps } from "react";

export const IconMail = (props: SVGProps<SVGSVGElement>) => (
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
    <rect x={3} y={5} width={18} height={14} rx={2} />
    <path d="m3 7 9 6 9-6" />
  </svg>
);
