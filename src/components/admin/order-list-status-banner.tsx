"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AdminOrdersListStatus } from "@/lib/orders/admin-types";

const messageFor = (status: AdminOrdersListStatus): string | null => {
  if (status === "created") return "Order created.";
  if (status === "updated") return "Order updated.";
  if (status === "deleted") return "Order deleted.";
  return null;
};

type OrderListStatusBannerProps = {
  status: AdminOrdersListStatus;
};

export const OrderListStatusBanner = ({
  status,
}: OrderListStatusBannerProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const message = messageFor(status);

  const [tracked, setTracked] = useState<{
    status: AdminOrdersListStatus;
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
