import { redirect } from "next/navigation";

type RegisterPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  qs.set("authView", "signup");
  if (params.error?.trim()) {
    qs.set("error", params.error.trim());
  }

  redirect(`/?${qs.toString()}`);
}
