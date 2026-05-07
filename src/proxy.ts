import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { UserRole } from "@/generated/prisma/enums";
import { SITE_ROUTES } from "@/lib/config/site-config";

/**
 * Role-based landing for `/post-login`: forwards admins to the dashboard and
 * everyone else to the home page. Runs before the route renders so the user
 * never sees the placeholder page. The matching server page (see
 * `src/app/(auth)/post-login/page.tsx`) keeps the same logic as a defense-in-
 * depth fallback for clients where proxy is bypassed.
 */
export async function proxy(req: NextRequest) {
  if (req.nextUrl.pathname !== SITE_ROUTES.postLogin) {
    return NextResponse.next();
  }

  const token = await getToken({ req });
  const targetPath =
    token?.role === UserRole.ADMIN ? SITE_ROUTES.dashboard : SITE_ROUTES.home;
  return NextResponse.redirect(new URL(targetPath, req.url));
}

export const config = {
  matcher: ["/post-login"],
};
