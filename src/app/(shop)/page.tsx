import Link from "next/link";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";
import { logoutAction } from "./actions";

export default async function HomePage() {
  const session = await auth();
  const user = session?.user;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-16">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold">Mobile Shop</h1>
        <p className="text-sm text-neutral-600">
          Browse products and manage your account.
        </p>
      </section>

      {user ? (
        <section className="space-y-4 rounded-md border border-neutral-200 p-4">
          <div className="space-y-1">
            <p className="text-sm text-neutral-600">Signed in as</p>
            <p className="font-medium">{user.email}</p>
            <p className="text-sm text-neutral-600">Role: {user.role}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            {user.role === UserRole.ADMIN ? (
              <Link
                href="/admin"
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
              >
                Open admin
              </Link>
            ) : null}
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white"
              >
                Logout
              </button>
            </form>
          </div>
        </section>
      ) : (
        <section className="space-y-4 rounded-md border border-neutral-200 p-4">
          <p className="text-sm text-neutral-700">
            You are not signed in. Create an account or log in to continue.
          </p>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              Register
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
