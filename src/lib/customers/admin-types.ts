/**
 * Plain, JSON-serialisable shapes shared across server pages and client forms
 * for the admin Customers module. Mirrors the conventions used by
 * `src/lib/products/admin-types.ts` so pages, tables, filters, and forms can
 * be wired the same way for both modules.
 *
 * `Date` values are converted to ISO `string` for client safety.
 */

import type { UserRole, UserStatus } from "@/generated/prisma/enums";

export type AdminCustomerRoleFilter = "all" | "user" | "admin";
export type AdminCustomerStatusFilter = "all" | UserStatus;

export type AdminCustomerListItem = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  /** First + last name composed for display, with email fallback. */
  displayName: string;
  phone: string | null;
  /** Public URL path under `/uploads/` or null when not set. */
  profileImagePath: string | null;
  role: UserRole;
  status: UserStatus;
  /** Pre-counted total orders so the table can show it without a second query. */
  ordersCount: number;
  createdAtIso: string;
  updatedAtIso: string;
};

export type AdminCustomerDetail = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  profileImagePath: string | null;
  role: UserRole;
  status: UserStatus;
  ordersCount: number;
  createdAtIso: string;
  updatedAtIso: string;
};

export type AdminCustomerListPage = {
  items: AdminCustomerListItem[];
  totalCount: number;
  page: number;
  perPage: number;
  pageCount: number;
};

export type AdminCustomersListFilters = {
  q: string;
  role: AdminCustomerRoleFilter;
  status: AdminCustomerStatusFilter;
  page: number;
};

/** Status banner echoed back into URL after a successful mutation. */
export type AdminCustomersListStatus = "created" | "updated" | "deleted" | null;
