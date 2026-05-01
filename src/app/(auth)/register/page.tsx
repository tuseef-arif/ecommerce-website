import Link from "next/link";
import { registerAction } from "./actions";

type RegisterPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">Create account</h1>
        <p className="text-sm text-neutral-600">Register to start shopping.</p>
      </section>

      {params.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {params.error}
        </p>
      ) : null}

      <form action={registerAction} className="space-y-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Email</span>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Password</span>
          <input
            name="password"
            type="password"
            minLength={8}
            required
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Confirm password</span>
          <input
            name="confirmPassword"
            type="password"
            minLength={8}
            required
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Register
        </button>
      </form>

      <p className="text-sm text-neutral-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-black underline">
          Login
        </Link>
      </p>
    </main>
  );
}
