import type { SVGProps } from "react";

export const IconInstagram = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={22}
    height={22}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.65}
    aria-hidden
    {...props}
  >
    <rect x={3} y={3} width={18} height={18} rx={5} />
    <circle cx={12} cy={12} r={3.75} />
    <path d="M17.5 6.5h.01" strokeLinecap="round" />
  </svg>
);
