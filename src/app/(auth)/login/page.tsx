import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
    authFlow?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  qs.set("authView", "login");
  if (params.success?.trim()) {
    qs.set(
      "authSuccess",
      params.authFlow?.trim() === "signup" ? "register" : "login",
    );
  }

  redirect(`/?${qs.toString()}`);
}
