import type {
  AdminProductsListFilters,
  AdminProductsListStatus,
} from "@/lib/products/admin-types";

export const ADMIN_PRODUCTS_PER_PAGE = 10;

const sanitizeSingle = (
  value: string | string[] | undefined,
  maxLength = 80,
): string => {
  if (Array.isArray(value)) value = value[0];
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
};

const parseStatus = (
  value: string | string[] | undefined,
): AdminProductsListFilters["status"] => {
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

export const parseAdminProductsListFilters = (
  searchParams: Record<string, string | string[] | undefined>,
): AdminProductsListFilters => ({
  q: sanitizeSingle(searchParams.q, 120),
  brand: sanitizeSingle(searchParams.brand, 80),
  category: sanitizeSingle(searchParams.category, 80).toLowerCase(),
  status: parseStatus(searchParams.status),
  page: parsePage(searchParams.page),
});

export const parseAdminProductsListStatus = (
  value: string | string[] | undefined,
): AdminProductsListStatus => {
  const raw = sanitizeSingle(value, 16);
  if (raw === "created" || raw === "updated" || raw === "deleted") return raw;
  return null;
};

type AdminProductsListHrefInput = Partial<
  Omit<AdminProductsListFilters, "status">
> & {
  /**
   * Accepts both list filter statuses and post-mutation banner statuses so
   * callers can pass either kind through; only `active`/`inactive` are kept in
   * the URL. Banner statuses (`created`/`updated`/`deleted`) and `all`/`null`
   * are dropped.
   */
  status?: AdminProductsListFilters["status"] | AdminProductsListStatus;
};

const FILTER_STATUSES_IN_URL: ReadonlySet<string> = new Set([
  "active",
  "inactive",
]);

/** Builds a relative URL for the products list with the given filters/page. */
export const buildAdminProductsListHref = (
  filters: AdminProductsListHrefInput,
): string => {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.brand) params.set("brand", filters.brand);
  if (filters.category) params.set("category", filters.category);
  if (filters.status && FILTER_STATUSES_IN_URL.has(filters.status)) {
    params.set("status", filters.status);
  }
  if (filters.page && filters.page > 1)
    params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `/dashboard/products?${query}` : "/dashboard/products";
};
