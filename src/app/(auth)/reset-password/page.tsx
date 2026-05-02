import { ResetPasswordForm } from "./reset-password-form";
import { StoreBrandTextLink } from "@/components/ui/store-brand-text-link";
import { SITE_ROUTES } from "@/lib/config/site-config";

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string; error?: string }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = params.token?.trim() ?? "";
  const hasToken = token.length > 0;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">Reset Password</h1>
        <p className="text-sm text-neutral-600">
          Choose a new password for your account.
        </p>
      </section>

      {params.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {params.error}
        </p>
      ) : null}

      {hasToken ? (
        <ResetPasswordForm token={token} />
      ) : (
        <p className="text-sm text-neutral-600">
          This link is missing a reset token. Request a new link from the
          sign-in screen or{" "}
          <StoreBrandTextLink href={SITE_ROUTES.login}>
            go to login
          </StoreBrandTextLink>
          .
        </p>
      )}

      <p className="text-sm text-neutral-600">
        <StoreBrandTextLink href={SITE_ROUTES.login}>
          Back to login
        </StoreBrandTextLink>
      </p>
    </main>
  );
}
