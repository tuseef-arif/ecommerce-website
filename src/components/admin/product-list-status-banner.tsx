"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AdminProductsListStatus } from "@/lib/products/admin-types";

const messageFor = (status: AdminProductsListStatus): string | null => {
  if (status === "created") return "Product created.";
  if (status === "updated") return "Product updated.";
  if (status === "deleted") return "Product deleted.";
  return null;
};

type ProductListStatusBannerProps = {
  status: AdminProductsListStatus;
};

export const ProductListStatusBanner = ({
  status,
}: ProductListStatusBannerProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const message = messageFor(status);

  /**
   * Reset visibility synchronously when the incoming `status` (and therefore
   * the message) changes — this is the "adjust state during render" pattern
   * the React docs prefer over a `setState`-in-effect reset.
   */
  const [tracked, setTracked] = useState<{
    status: AdminProductsListStatus;
    isVisible: boolean;
  }>({ status, isVisible: Boolean(message) });

  if (tracked.status !== status) {
    setTracked({ status, isVisible: Boolean(message) });
  }

  const shouldAutoDismiss = status === "updated";

  const dismissHref = useMemo(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("status");
    const query = next.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!shouldAutoDismiss || !message) return;

    const timer = window.setTimeout(() => {
      setTracked((current) =>
        current.status === status ? { ...current, isVisible: false } : current,
      );
      router.replace(dismissHref);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [dismissHref, message, router, shouldAutoDismiss, status]);

  if (!message || !tracked.isVisible) return null;

  return (
    <p
      role="status"
      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"
    >
      {message}
    </p>
  );
};
