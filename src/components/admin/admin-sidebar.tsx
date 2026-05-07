"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { logoutAction } from "@/app/(shop)/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type AdminSidebarItem =
  | { kind: "link"; label: string; href: string; isImplemented: boolean }
  | { kind: "logout"; label: string };

const ADMIN_SIDEBAR_ITEMS: ReadonlyArray<AdminSidebarItem> = [
  { kind: "link", label: "Dashboard", href: "/dashboard", isImplemented: true },
  {
    kind: "link",
    label: "Orders",
    href: "/dashboard/orders",
    isImplemented: true,
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
    isImplemented: true,
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
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleLogoutConfirm = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <>
      <aside className="flex h-full min-h-[calc(100dvh-6rem)] flex-col rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm lg:min-h-[calc(100dvh-3rem)]">
        <div className="mb-4 flex flex-col items-center justify-center gap-2 px-2 pt-1">
          <Image
            src="/logos/fsm-logo-clean.png"
            alt="Brand logo"
            width={88}
            height={88}
            className="h-auto w-[88px]"
            priority
          />
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-[var(--store-brand-primary)]">
            Admin panel
          </p>
        </div>

        <nav className="mt-2 flex-1 space-y-1" aria-label="Dashboard sections">
          {ADMIN_SIDEBAR_ITEMS.map((item) => {
            if (item.kind === "logout") {
              return (
                <button
                  key="logout"
                  type="button"
                  onClick={() => setIsLogoutDialogOpen(true)}
                  className={`${baseItemClass} text-neutral-700 hover:bg-neutral-100`}
                >
                  {item.label}
                </button>
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

      <ConfirmDialog
        isOpen={isLogoutDialogOpen}
        title="Log out from admin panel?"
        description="You will be signed out and redirected to the storefront."
        confirmLabel="Log out"
        confirmVariant="danger"
        isPending={isPending}
        onClose={() => setIsLogoutDialogOpen(false)}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
};
