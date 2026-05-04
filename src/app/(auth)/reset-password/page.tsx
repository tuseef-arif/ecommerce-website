import { redirect } from "next/navigation";

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string; error?: string }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  qs.set("authView", "reset-password");
  if (params.token?.trim()) {
    qs.set("token", params.token.trim());
  }
  if (params.error?.trim()) {
    qs.set("error", params.error.trim());
  }

  redirect(`/?${qs.toString()}`);
}
