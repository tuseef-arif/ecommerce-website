import { NextResponse } from "next/server";
import { z } from "zod";
import { globalSearch } from "@/lib/search/global-search";

const querySchema = z.object({
  q: z.string().trim().min(1).max(80),
  limit: z.coerce.number().int().min(1).max(20).optional(),
});

/* <SECURITY_REVIEW>
 * Vulnerability audit:
 * - User-controlled input: `q` and `limit` come from URL params and are validated
 *   with Zod before reaching data access.
 * - SQL injection: all reads use Prisma query builder (parameterized), no raw SQL.
 * - Auth bypass / data exposure: endpoint returns catalog-search-safe fields only
 *   (no secrets, no admin/private columns).
 * - DoS risk: bounded query length and bounded per-group limits reduce expensive
 *   wildcard scans and oversized payloads.
 *
 * Mitigations applied:
 * - Runtime input validation and coercion through `querySchema`.
 * - Hard caps on query and result size.
 * - Safe, minimal projection from Prisma selects.
 *
 * Verification test case:
 * - `GET /api/search/global?q=gal&limit=5` returns 200 with grouped results.
 * - `GET /api/search/global?q=&limit=999` returns 400 with validation error.
 * </SECURITY_REVIEW>
 */
export const GET = async (request: Request) => {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    limit: url.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid query parameters.",
        issues: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  }

  const data = await globalSearch({
    query: parsed.data.q,
    limitPerGroup: parsed.data.limit,
  });

  return NextResponse.json({ ok: true, data });
};
