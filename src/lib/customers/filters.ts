import type {
  AdminCustomerRoleFilter,
  AdminCustomerStatusFilter,
  AdminCustomersListFilters,
  AdminCustomersListStatus,
} from "@/lib/customers/admin-types";

export const ADMIN_CUSTOMERS_PER_PAGE = 10;

const sanitizeSingle = (
  value: string | string[] | undefined,
  maxLength = 80,
): string => {
  if (Array.isArray(value)) value = value[0];
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
};

const parseRole = (
  value: string | string[] | undefined,
): AdminCustomerRoleFilter => {
  const raw = sanitizeSingle(value, 16).toLowerCase();
  if (raw === "user" || raw === "admin") return raw;
  return "all";
};

/**
 * Parses the user account status from `?status=`. Shares the URL param with
 * the post-mutation banner status (`created|updated|deleted`); vocabularies
 * don't overlap so the two parsers multiplex cleanly. Mirrors the orders
 * module's approach.
 */
const parseStatus = (
  value: string | string[] | undefined,
): AdminCustomerStatusFilter => {
  const raw = sanitizeSingle(value, 16).toUpperCase();
  if (raw === "ACTIVE" || raw === "INACTIVE") return raw;
  return "all";
};

const parsePage = (value: string | string[] | undefined): number => {
  const raw = sanitizeSingle(value, 8);
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(parsed, 10_000);
};

export const parseAdminCustomersListFilters = (
  searchParams: Record<string, string | string[] | undefined>,
): AdminCustomersListFilters => ({
  q: sanitizeSingle(searchParams.q, 120),
  role: parseRole(searchParams.role),
  status: parseStatus(searchParams.status),
  page: parsePage(searchParams.page),
});

export const parseAdminCustomersListStatus = (
  value: string | string[] | undefined,
): AdminCustomersListStatus => {
  const raw = sanitizeSingle(value, 16);
  if (raw === "created" || raw === "updated" || raw === "deleted") return raw;
  return null;
};

type AdminCustomersListHrefInput = Partial<
  Omit<AdminCustomersListFilters, "role" | "status">
> & {
  /**
   * Accepts both list filter roles and post-mutation banner statuses. Only
   * `user`/`admin` end up in the URL; banner statuses or `all`/`null` are
   * dropped (consistent with the products filters helper).
   */
  role?: AdminCustomerRoleFilter | AdminCustomersListStatus;
  /**
   * User account status filter. Only `ACTIVE`/`INACTIVE` end up in the URL.
   * Shares the `?status=` param with the post-mutation banner; vocabularies
   * don't overlap so callers can pass either kind of value here safely.
   */
  status?: AdminCustomerStatusFilter | AdminCustomersListStatus;
};

const FILTER_ROLES_IN_URL: ReadonlySet<string> = new Set(["user", "admin"]);
const FILTER_STATUSES_IN_URL: ReadonlySet<string> = new Set([
  "ACTIVE",
  "INACTIVE",
]);

/** Builds a relative URL for the customers list with the given filters/page. */
export const buildAdminCustomersListHref = (
  filters: AdminCustomersListHrefInput,
): string => {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.role && FILTER_ROLES_IN_URL.has(filters.role)) {
    params.set("role", filters.role);
  }
  if (filters.status && FILTER_STATUSES_IN_URL.has(filters.status)) {
    params.set("status", filters.status);
  }
  if (filters.page && filters.page > 1)
    params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `/dashboard/customers?${query}` : "/dashboard/customers";
};
