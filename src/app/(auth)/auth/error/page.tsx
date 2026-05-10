import { redirect } from "next/navigation";
import { SITE_ROUTES } from "@/lib/config/site-config";

type AuthErrorPageProps = {
  searchParams: Promise<{ error?: string }>;
};

/** Legacy `/auth/error` URL — forward into the store login popover with the same error code. */
export default async function AuthErrorPage({
  searchParams,
}: AuthErrorPageProps) {
  const params = await searchParams;
  const q = new URLSearchParams();
  q.set("authView", "login");
  const raw = params.error;
  if (typeof raw === "string" && raw.trim().length > 0) {
    q.set("error", raw.trim());
  }
  redirect(`${SITE_ROUTES.home}?${q.toString()}`);
}
