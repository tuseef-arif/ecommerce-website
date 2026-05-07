import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/enums";
import { auth } from "@/auth";
import { SITE_ROUTES } from "@/lib/config/site-config";

/**
 * Server-rendered fallback for the `/post-login` middleware redirect: if the
 * middleware doesn't run (legacy/bypassed clients), this page mirrors the same
 * role-based redirect so users always land on dashboard/home as expected.
 */
export default async function PostLoginPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(SITE_ROUTES.home);
  }

  redirect(
    session.user.role === UserRole.ADMIN
      ? SITE_ROUTES.dashboard
      : SITE_ROUTES.home,
  );
}
