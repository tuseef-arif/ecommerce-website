import "server-only";

import {
  calendarDayKeyInTimeZone,
  formatInstantForStoreDateOrNull,
} from "@/lib/datetime/display-timezone";
import { prisma } from "@/lib/prisma";
import { ADMIN_DISCOUNTS_PER_PAGE } from "@/lib/discounts/filters";
import type { DiscountTypeValue } from "@/lib/discounts/constants";
import type {
  AdminDiscountDetail,
  AdminDiscountListItem,
  AdminDiscountListPage,
  AdminDiscountsListFilters,
} from "@/lib/discounts/admin-types";

const toDateInputValue = (d: Date | null): string =>
  d ? calendarDayKeyInTimeZone(d) : "";

const formatMoney = (raw: string): string => {
  const numeric = Number.parseFloat(raw);
  if (!Number.isFinite(numeric)) return raw;
  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDiscountValueDisplay = (
  type: DiscountTypeValue,
  valueStr: string,
): string => {
  const numeric = Number.parseFloat(valueStr);
  if (!Number.isFinite(numeric)) return valueStr;
  if (type === "PERCENTAGE") {
    const text =
      numeric % 1 === 0
        ? String(numeric)
        : numeric.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          });
    return `${text}%`;
  }
  return formatMoney(valueStr);
};

const buildDiscountWhere = (filters: AdminDiscountsListFilters) => {
  const where: Record<string, unknown> = {};

  if (filters.q.length > 0) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { code: { contains: filters.q.toUpperCase(), mode: "insensitive" } },
    ];
  }
  if (filters.status === "active") where.isActive = true;
  if (filters.status === "inactive") where.isActive = false;

  return where;
};

export const listAdminDiscounts = async (
  filters: AdminDiscountsListFilters,
  perPage: number = ADMIN_DISCOUNTS_PER_PAGE,
): Promise<AdminDiscountListPage> => {
  const where = buildDiscountWhere(filters);
  const skip = (filters.page - 1) * perPage;

  const [rows, totalCount] = await Promise.all([
    prisma.discount.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: perPage,
      select: {
        id: true,
        name: true,
        code: true,
        discountType: true,
        discountValue: true,
        minOrderAmount: true,
        maxDiscountAmount: true,
        startAt: true,
        endAt: true,
        isActive: true,
        updatedAt: true,
      },
    }),
    prisma.discount.count({ where }),
  ]);

  const items: AdminDiscountListItem[] = rows.map((row) => {
    const type = row.discountType as DiscountTypeValue;
    const valueStr = row.discountValue.toFixed(2);
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      discountType: type,
      discountValueDisplay: formatDiscountValueDisplay(type, valueStr),
      minOrderAmountDisplay:
        row.minOrderAmount === null
          ? null
          : formatMoney(row.minOrderAmount.toFixed(2)),
      maxDiscountAmountDisplay:
        row.maxDiscountAmount === null
          ? null
          : formatMoney(row.maxDiscountAmount.toFixed(2)),
      startDateDisplay: formatInstantForStoreDateOrNull(row.startAt),
      endDateDisplay: formatInstantForStoreDateOrNull(row.endAt),
      isActive: row.isActive,
      updatedAtIso: row.updatedAt.toISOString(),
    };
  });

  const pageCount = totalCount === 0 ? 1 : Math.ceil(totalCount / perPage);

  return {
    items,
    totalCount,
    page: filters.page,
    perPage,
    pageCount,
  };
};

export const getAdminDiscountById = async (
  id: string,
): Promise<AdminDiscountDetail | null> => {
  const row = await prisma.discount.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      code: true,
      discountType: true,
      discountValue: true,
      minOrderAmount: true,
      maxDiscountAmount: true,
      startAt: true,
      endAt: true,
      isActive: true,
    },
  });

  if (!row) return null;

  const type = row.discountType as DiscountTypeValue;
  const valueNum = Number(row.discountValue);
  const discountValue =
    type === "PERCENTAGE" && valueNum % 1 !== 0
      ? valueNum.toFixed(2)
      : type === "PERCENTAGE"
        ? String(valueNum)
        : row.discountValue.toFixed(2);

  return {
    id: row.id,
    name: row.name,
    code: row.code,
    discountType: type,
    discountValue,
    minOrderAmount:
      row.minOrderAmount === null ? "" : row.minOrderAmount.toFixed(2),
    maxDiscountAmount:
      row.maxDiscountAmount === null ? "" : row.maxDiscountAmount.toFixed(2),
    startDate: toDateInputValue(row.startAt),
    endDate: toDateInputValue(row.endAt),
    isActive: row.isActive,
  };
};
