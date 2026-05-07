import type {
  AdminCustomerRoleFilter,
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
  Omit<AdminCustomersListFilters, "role">
> & {
  /**
   * Accepts both list filter roles and post-mutation banner statuses. Only
   * `user`/`admin` end up in the URL; banner statuses or `all`/`null` are
   * dropped (consistent with the products filters helper).
   */
  role?: AdminCustomerRoleFilter | AdminCustomersListStatus;
};

const FILTER_ROLES_IN_URL: ReadonlySet<string> = new Set(["user", "admin"]);

/** Builds a relative URL for the customers list with the given filters/page. */
export const buildAdminCustomersListHref = (
  filters: AdminCustomersListHrefInput,
): string => {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.role && FILTER_ROLES_IN_URL.has(filters.role)) {
    params.set("role", filters.role);
  }
  if (filters.page && filters.page > 1)
    params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `/dashboard/customers?${query}` : "/dashboard/customers";
};
