import type {
  AdminOrderPaymentMethodFilter,
  AdminOrderStatusFilter,
  AdminOrdersListFilters,
  AdminOrdersListStatus,
} from "@/lib/orders/admin-types";

export const ADMIN_ORDERS_PER_PAGE = 10;

const sanitizeSingle = (
  value: string | string[] | undefined,
  maxLength = 80,
): string => {
  if (Array.isArray(value)) value = value[0];
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const parseStatus = (
  value: string | string[] | undefined,
): AdminOrderStatusFilter => {
  const raw = sanitizeSingle(value, 16).toUpperCase();
  if (
    raw === "PENDING" ||
    raw === "CONFIRMED" ||
    raw === "SHIPPED" ||
    raw === "DELIVERED"
  )
    return raw;
  return "all";
};

const parsePaymentMethod = (
  value: string | string[] | undefined,
): AdminOrderPaymentMethodFilter => {
  const raw = sanitizeSingle(value, 32).toUpperCase();
  if (raw === "BANK_TRANSFER" || raw === "SELF_COLLECTION" || raw === "COD") {
    return raw;
  }
  return "all";
};

const parseDate = (value: string | string[] | undefined): string => {
  const raw = sanitizeSingle(value, 10);
  if (!ISO_DATE_RE.test(raw)) return "";
  const parsed = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return "";
  return raw;
};

const parsePage = (value: string | string[] | undefined): number => {
  const raw = sanitizeSingle(value, 8);
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(parsed, 10_000);
};

export const parseAdminOrdersListFilters = (
  searchParams: Record<string, string | string[] | undefined>,
): AdminOrdersListFilters => ({
  q: sanitizeSingle(searchParams.q, 120),
  status: parseStatus(searchParams.status),
  paymentMethod: parsePaymentMethod(searchParams.paymentMethod),
  from: parseDate(searchParams.from),
  to: parseDate(searchParams.to),
  page: parsePage(searchParams.page),
});

export const parseAdminOrdersListStatus = (
  value: string | string[] | undefined,
): AdminOrdersListStatus => {
  const raw = sanitizeSingle(value, 16);
  if (raw === "created" || raw === "updated" || raw === "deleted") return raw;
  return null;
};

type AdminOrdersListHrefInput = Partial<
  Omit<AdminOrdersListFilters, "status">
> & {
  status?: AdminOrderStatusFilter | AdminOrdersListStatus;
};

const FILTER_STATUSES_IN_URL: ReadonlySet<string> = new Set([
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
]);

const FILTER_PAYMENT_METHODS_IN_URL: ReadonlySet<string> = new Set([
  "BANK_TRANSFER",
  "SELF_COLLECTION",
  "COD",
]);

export const buildAdminOrdersListHref = (
  filters: AdminOrdersListHrefInput,
): string => {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status && FILTER_STATUSES_IN_URL.has(filters.status)) {
    params.set("status", filters.status);
  }
  if (
    filters.paymentMethod &&
    FILTER_PAYMENT_METHODS_IN_URL.has(filters.paymentMethod)
  ) {
    params.set("paymentMethod", filters.paymentMethod);
  }
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.page && filters.page > 1)
    params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `/dashboard/orders?${query}` : "/dashboard/orders";
};
