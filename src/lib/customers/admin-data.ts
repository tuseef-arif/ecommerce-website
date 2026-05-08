import "server-only";

import { prisma } from "@/lib/prisma";
import { ADMIN_CUSTOMERS_PER_PAGE } from "@/lib/customers/filters";
import { composeCustomerDisplayName } from "@/lib/customers/display";
import type {
  AdminCustomerDetail,
  AdminCustomerListItem,
  AdminCustomerListPage,
  AdminCustomersListFilters,
} from "@/lib/customers/admin-types";

const buildCustomerWhere = (filters: AdminCustomersListFilters) => {
  const where: Record<string, unknown> = {};

  if (filters.q.length > 0) {
    where.OR = [
      { email: { contains: filters.q, mode: "insensitive" } },
      { firstName: { contains: filters.q, mode: "insensitive" } },
      { lastName: { contains: filters.q, mode: "insensitive" } },
      { phone: { contains: filters.q, mode: "insensitive" } },
      { address: { contains: filters.q, mode: "insensitive" } },
      { city: { contains: filters.q, mode: "insensitive" } },
      { country: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.role === "user") where.role = "USER";
  if (filters.role === "admin") where.role = "ADMIN";
  if (filters.status !== "all") where.status = filters.status;

  return where;
};

export const listAdminCustomers = async (
  filters: AdminCustomersListFilters,
  perPage: number = ADMIN_CUSTOMERS_PER_PAGE,
): Promise<AdminCustomerListPage> => {
  const where = buildCustomerWhere(filters);
  const skip = (filters.page - 1) * perPage;

  const [rows, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        profileImagePath: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const items: AdminCustomerListItem[] = rows.map((row) => ({
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    displayName: composeCustomerDisplayName({
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
    }),
    phone: row.phone,
    address: row.address,
    city: row.city,
    country: row.country,
    profileImagePath: row.profileImagePath,
    role: row.role,
    status: row.status,
    ordersCount: row._count.orders,
    createdAtIso: row.createdAt.toISOString(),
    updatedAtIso: row.updatedAt.toISOString(),
  }));

  const pageCount = totalCount === 0 ? 1 : Math.ceil(totalCount / perPage);

  return {
    items,
    totalCount,
    page: filters.page,
    perPage,
    pageCount,
  };
};

export const getAdminCustomerById = async (
  customerId: string,
): Promise<AdminCustomerDetail | null> => {
  const row = await prisma.user.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      address: true,
      city: true,
      country: true,
      profileImagePath: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { orders: true } },
    },
  });
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName ?? "",
    lastName: row.lastName ?? "",
    phone: row.phone ?? "",
    address: row.address ?? "",
    city: row.city ?? "",
    country: row.country ?? "",
    profileImagePath: row.profileImagePath,
    role: row.role,
    status: row.status,
    ordersCount: row._count.orders,
    createdAtIso: row.createdAt.toISOString(),
    updatedAtIso: row.updatedAt.toISOString(),
  };
};

/**
 * Lightweight customer options used by the admin Order form. Returns the
 * most-recently-created customers up to `take`. Larger deployments should
 * upgrade this to a typeahead endpoint; for now the cap keeps the select
 * payload bounded.
 */
export const listAdminCustomerOptions = async (
  take = 200,
): Promise<Array<{ id: string; email: string; displayName: string }>> => {
  const rows = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    displayName: composeCustomerDisplayName({
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
    }),
  }));
};
