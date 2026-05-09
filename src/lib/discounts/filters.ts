import type {
  AdminDiscountsListFilters,
  AdminDiscountsListStatus,
  AdminDiscountsListStatusFilter,
} from "@/lib/discounts/admin-types";

export const ADMIN_DISCOUNTS_PER_PAGE = 10;

const sanitizeSingle = (
  value: string | string[] | undefined,
  maxLength = 80,
): string => {
  if (Array.isArray(value)) value = value[0];
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
};

const parseStatusFilter = (
  value: string | string[] | undefined,
): AdminDiscountsListStatusFilter => {
  const raw = sanitizeSingle(value, 16).toLowerCase();
  if (raw === "active" || raw === "inactive") return raw;
  return "all";
};

const parsePage = (value: string | string[] | undefined): number => {
  const raw = sanitizeSingle(value, 8);
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(parsed, 10_000);
};

export const parseAdminDiscountsListFilters = (
  searchParams: Record<string, string | string[] | undefined>,
): AdminDiscountsListFilters => ({
  q: sanitizeSingle(searchParams.q, 120),
  status: parseStatusFilter(searchParams.status),
  page: parsePage(searchParams.page),
});

export const parseAdminDiscountsListStatus = (
  value: string | string[] | undefined,
): AdminDiscountsListStatus => {
  const raw = sanitizeSingle(value, 16);
  if (raw === "created" || raw === "updated" || raw === "deleted") return raw;
  return null;
};

type AdminDiscountsListHrefInput = Partial<
  Omit<AdminDiscountsListFilters, "status">
> & {
  status?: AdminDiscountsListStatusFilter | AdminDiscountsListStatus;
};

const FILTER_STATUSES_IN_URL: ReadonlySet<string> = new Set([
  "active",
  "inactive",
]);

/** Query string (no leading `?`) for list filters; used by list URLs and edit links. */
export const buildAdminDiscountsListQueryString = (
  filters: AdminDiscountsListHrefInput,
): string => {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status && FILTER_STATUSES_IN_URL.has(filters.status)) {
    params.set("status", filters.status);
  }
  if (filters.page && filters.page > 1)
    params.set("page", String(filters.page));
  return params.toString();
};

export const buildAdminDiscountsListHref = (
  filters: AdminDiscountsListHrefInput,
): string => {
  const query = buildAdminDiscountsListQueryString(filters);
  return query ? `/dashboard/discounts?${query}` : "/dashboard/discounts";
};
