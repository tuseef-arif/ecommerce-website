"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { AdminHeroSlidesListStatus } from "@/lib/hero/admin-types";

const messageFor = (status: AdminHeroSlidesListStatus): string | null => {
  if (status === "created") return "Hero slide created.";
  if (status === "updated") return "Hero slide updated.";
  if (status === "deleted") return "Hero slide deleted.";
  return null;
};

type HeroSlideListStatusBannerProps = {
  status: AdminHeroSlidesListStatus;
};

export const HeroSlideListStatusBanner = ({
  status,
}: HeroSlideListStatusBannerProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const message = messageFor(status);

  const [tracked, setTracked] = useState<{
    status: AdminHeroSlidesListStatus;
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
