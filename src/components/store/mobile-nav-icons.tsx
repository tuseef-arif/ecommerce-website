import type { ReactNode, SVGProps } from "react";

const base = "h-6 w-6 shrink-0 text-neutral-400";

type IconProps = SVGProps<SVGSVGElement>;

const Svg = ({
  className,
  children,
  ...rest
}: IconProps & { children: ReactNode }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
    {...rest}
  >
    {children}
  </svg>
);

/** Line icons for mobile category drawer — `id` matches nav group / more-item ids */
export const MobileNavCategoryIcon = ({
  id,
  className = "",
}: {
  id: string;
  className?: string;
}) => {
  const cn = `${base} ${className}`.trim();

  switch (id) {
    case "mobiles":
      return (
        <Svg className={cn}>
          <rect x="7" y="3" width="10" height="18" rx="2" />
          <path d="M10 6h4M10 18h4" />
        </Svg>
      );
    case "earbuds":
      return (
        <Svg className={cn}>
          <path d="M5 14a3 3 0 0 1 3-3h1v6H8a3 3 0 0 1-3-3v0Z" />
          <path d="M19 14a3 3 0 0 0-3-3h-1v6h1a3 3 0 0 0 3-3v0Z" />
          <path d="M8 11V9a4 4 0 0 1 8 0v2" />
        </Svg>
      );
    case "smart-watches":
      return (
        <Svg className={cn}>
          <rect x="6" y="6" width="12" height="12" rx="3" />
          <path d="M9 18v2M15 18v2M9 4v2M15 4v2" />
        </Svg>
      );
    case "power-banks":
      return (
        <Svg className={cn}>
          <rect x="7" y="7" width="10" height="12" rx="1.5" />
          <path d="M10 10h4M12 7v-2" />
        </Svg>
      );
    case "data-cables":
      return (
        <Svg className={cn}>
          <path d="M4 12h4l2-3 4 6 2-3h4" />
          <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="20" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </Svg>
      );
    case "chargers":
      return (
        <Svg className={cn}>
          <rect x="10" y="2" width="4" height="6" rx="1" />
          <path d="M8 8h8v4a4 4 0 0 1-4 4h0a4 4 0 0 1-4-4V8Z" />
        </Svg>
      );
    case "speakers":
      return (
        <Svg className={cn}>
          <rect x="5" y="7" width="14" height="10" rx="2" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M7 7V5M17 7V5" />
        </Svg>
      );
    case "tablets":
      return (
        <Svg className={cn}>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M10 19h4" />
        </Svg>
      );
    case "headphones":
      return (
        <Svg className={cn}>
          <path d="M4 14v-1a8 8 0 0 1 16 0v1" />
          <rect x="2" y="14" width="4" height="6" rx="1" />
          <rect x="18" y="14" width="4" height="6" rx="1" />
        </Svg>
      );
    case "car-accessories":
      return (
        <Svg className={cn}>
          <circle cx="7" cy="17" r="2.5" />
          <circle cx="17" cy="17" r="2.5" />
          <path d="M4.5 17H3l2-6h5l2 3h2l2-3h5l2 6h-1.5" />
        </Svg>
      );
    default:
      return (
        <Svg className={cn}>
          <rect x="4" y="4" width="7" height="7" rx="1" />
          <rect x="13" y="4" width="7" height="7" rx="1" />
          <rect x="4" y="13" width="7" height="7" rx="1" />
          <rect x="13" y="13" width="7" height="7" rx="1" />
        </Svg>
      );
  }
};
