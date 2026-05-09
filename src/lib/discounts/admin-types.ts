import type { DiscountTypeValue } from "@/lib/discounts/constants";

export type AdminDiscountsListStatusFilter = "all" | "active" | "inactive";

export type AdminDiscountsListFilters = {
  q: string;
  status: AdminDiscountsListStatusFilter;
  page: number;
};

export type AdminDiscountsListStatus = "created" | "updated" | "deleted" | null;

export type AdminDiscountListItem = {
  id: string;
  name: string;
  code: string;
  discountType: DiscountTypeValue;
  discountValueDisplay: string;
  minOrderAmountDisplay: string | null;
  maxDiscountAmountDisplay: string | null;
  startDateDisplay: string | null;
  endDateDisplay: string | null;
  isActive: boolean;
  updatedAtIso: string;
};

export type AdminDiscountListPage = {
  items: AdminDiscountListItem[];
  totalCount: number;
  page: number;
  perPage: number;
  pageCount: number;
};

/** Detail payload for the admin create/edit form. */
export type AdminDiscountDetail = {
  id: string;
  name: string;
  code: string;
  discountType: DiscountTypeValue;
  discountValue: string;
  minOrderAmount: string;
  maxDiscountAmount: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
};
