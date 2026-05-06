"use server";

import { z } from "zod";
import {
  STORE_PRODUCTS_PAGE_SIZE,
  listStorefrontProductsPage,
  type StorefrontProductsSort,
} from "@/lib/products/storefront-data";
import type { StorefrontProductCardItem } from "@/lib/products/storefront-types";

/**
 * Lazy-load page request from the public products listing client component.
 * Inputs are bounded so a hostile caller cannot fan out into expensive
 * queries; the data fetcher additionally clamps `skip`/`take`.
 */
const loadMoreSchema = z.object({
  categorySlug: z
    .string()
    .max(80)
    .transform((value) => value.trim().toLowerCase()),
  brand: z
    .string()
    .max(80)
    .transform((value) => value.trim()),
  sort: z.enum(["latest", "price-desc", "price-asc"]),
  skip: z.number().int().min(0).max(10_000),
});

export type LoadMoreStorefrontProductsResult =
  | {
      ok: true;
      items: StorefrontProductCardItem[];
      hasMore: boolean;
      nextSkip: number;
    }
  | { ok: false; error: "INVALID_INPUT" | "UNEXPECTED_ERROR" };

/**
 * <SECURITY_REVIEW>
 * - Vulnerability audit:
 *   - **SQL injection / Prisma input safety:** all filters are validated by
 *     the Zod schema and the underlying data fetcher passes them as Prisma
 *     params (never interpolated into raw SQL).
 *   - **Resource exhaustion:** `skip` is capped at 10,000 here and the data
 *     fetcher additionally clamps `take` to `STORE_PRODUCTS_PAGE_SIZE` and
 *     enforces an absolute cap, so a hostile client cannot escalate cost.
 *   - **Auth bypass / sensitive data exposure:** this action only returns
 *     publicly visible product cards (active + in-stock), the same shape the
 *     home rails already render.
 *   - **CSRF:** Server Actions are POST-only and protected by Next.js's
 *     built-in action verification, so no extra token is required.
 * - Mitigations applied: Zod validation, hard caps on pagination inputs,
 *   read-only Prisma calls, no PII in payload.
 * - Verification test case:
 *   1. Send
 *      `{ categorySlug: "mobiles", brand: "samsung", sort: "price-desc", skip: 0 }`
 *      and
 *      confirm `items.length <= STORE_PRODUCTS_PAGE_SIZE` and only active,
 *      in-stock products are returned.
 *   2. Send
 *      `{ categorySlug: "x".repeat(200), brand: "", sort: "latest", skip: 0 }`
 *      and
 *      confirm Zod rejects with `INVALID_INPUT`.
 *   3. Send
 *      `{ categorySlug: "mobiles", brand: "", sort: "latest", skip: 9_999_999 }`
 *      and
 *      confirm Zod rejects with `INVALID_INPUT`.
 * </SECURITY_REVIEW>
 */
export const loadMoreStorefrontProductsAction = async (input: {
  categorySlug: string;
  brand: string;
  sort: StorefrontProductsSort;
  skip: number;
}): Promise<LoadMoreStorefrontProductsResult> => {
  const parsed = loadMoreSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  try {
    const { categorySlug, brand, sort, skip } = parsed.data;
    const page = await listStorefrontProductsPage({
      categorySlug,
      brand,
      sort,
      skip,
      take: STORE_PRODUCTS_PAGE_SIZE,
    });

    return {
      ok: true,
      items: page.items,
      hasMore: page.hasMore,
      nextSkip: skip + page.items.length,
    };
  } catch (error) {
    console.error("loadMoreStorefrontProductsAction failed", { input, error });
    return { ok: false, error: "UNEXPECTED_ERROR" };
  }
};
