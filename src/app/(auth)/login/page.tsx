import Link from "next/link";
import { LoginForm } from "./login-form";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="text-sm text-neutral-600">
          Sign in with your email and password.
        </p>
      </section>

      {params.success ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {params.success}
        </p>
      ) : null}

      {params.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {params.error}
        </p>
      ) : null}

      <LoginForm />

      <p className="text-sm text-neutral-600">
        No account yet?{" "}
        <Link href="/register" className="font-medium text-black underline">
          Create one
        </Link>
      </p>
    </main>
  );
}
