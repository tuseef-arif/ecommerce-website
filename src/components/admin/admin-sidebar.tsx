"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/(shop)/actions";
import { STORE_BUSINESS_NAME } from "@/lib/config/site-config";

type AdminSidebarItem =
  | { kind: "link"; label: string; href: string; isImplemented: boolean }
  | { kind: "logout"; label: string };

const ADMIN_SIDEBAR_ITEMS: ReadonlyArray<AdminSidebarItem> = [
  { kind: "link", label: "Dashboard", href: "/dashboard", isImplemented: true },
  {
    kind: "link",
    label: "Orders",
    href: "/dashboard/orders",
    isImplemented: false,
  },
  {
    kind: "link",
    label: "Products",
    href: "/dashboard/products",
    isImplemented: true,
  },
  {
    kind: "link",
    label: "Customers",
    href: "/dashboard/customers",
    isImplemented: false,
  },
  {
    kind: "link",
    label: "Reports",
    href: "/dashboard/reports",
    isImplemented: false,
  },
  {
    kind: "link",
    label: "Discounts",
    href: "/dashboard/discounts",
    isImplemented: false,
  },
  { kind: "logout", label: "Log out" },
];

const baseItemClass =
  "flex w-full items-center justify-start rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors";

const isItemActive = (pathname: string | null, href: string): boolean => {
  if (!pathname) return false;
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
};

export const AdminSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="px-2 text-2xl font-bold text-[var(--store-brand-primary)]">
        {STORE_BUSINESS_NAME.split(" ")[0] ?? STORE_BUSINESS_NAME}
      </p>
      <p className="mb-5 px-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
        Admin panel
      </p>

      <nav className="space-y-1" aria-label="Dashboard sections">
        {ADMIN_SIDEBAR_ITEMS.map((item) => {
          if (item.kind === "logout") {
            return (
              <form key="logout" action={logoutAction}>
                <button
                  type="submit"
                  className={`${baseItemClass} text-neutral-700 hover:bg-neutral-100`}
                >
                  {item.label}
                </button>
              </form>
            );
          }

          const isActive = isItemActive(pathname, item.href);
          const activeClass = isActive
            ? "bg-[var(--store-brand-accent)] text-white shadow-sm"
            : item.isImplemented
              ? "text-neutral-700 hover:bg-neutral-100"
              : "cursor-not-allowed text-neutral-400";

          if (!item.isImplemented) {
            return (
              <button
                key={item.label}
                type="button"
                aria-disabled
                disabled
                title="Coming soon"
                className={`${baseItemClass} ${activeClass}`}
              >
                {item.label}
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`${baseItemClass} ${activeClass}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
