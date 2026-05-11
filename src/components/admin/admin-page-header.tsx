import type { ReactNode } from "react";
import Link from "next/link";
import { SITE_URL } from "@/lib/config/site-config";

const visitWebsiteButtonClass =
  "inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-[var(--store-brand-primary)] px-4 text-sm font-semibold text-white shadow-sm transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]";

type AdminPageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
};

export const AdminPageHeader = ({
  title,
  description,
  actions,
}: AdminPageHeaderProps) => (
  <header className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
    <div className="space-y-1">
      <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
      {description ? (
        <p className="text-sm text-neutral-600">{description}</p>
      ) : null}
    </div>
    <div className="flex flex-wrap items-center justify-end gap-2 sm:justify-end">
      {actions}
      <Link
        href={SITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        prefetch={false}
        className={visitWebsiteButtonClass}
      >
        Visit Website
      </Link>
    </div>
  </header>
);
