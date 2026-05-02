import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { StoreBrandTextLink } from "@/components/ui/store-brand-text-link";
import {
  SITE_HEADER,
  SITE_LOGIN_PAGE,
  SITE_ROUTES,
  STORE_BUSINESS_NAME,
} from "@/lib/config/site-config";

export const metadata: Metadata = {
  title: `Login | ${STORE_BUSINESS_NAME}`,
  description: SITE_LOGIN_PAGE.metaDescription.replace(
    "{business}",
    STORE_BUSINESS_NAME,
  ),
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-900">
          {SITE_HEADER.accountPopoverLoginHeading}
        </h1>
        <p className="auth-page-lead">{SITE_LOGIN_PAGE.intro}</p>
      </section>

      {params.success ? (
        <p className="auth-page-alert auth-page-alert--success" role="status">
          {params.success}
        </p>
      ) : null}

      {params.error ? (
        <p className="auth-page-alert auth-page-alert--error" role="alert">
          {params.error}
        </p>
      ) : null}

      <LoginForm />

      <p className="auth-page-lead">
        {SITE_LOGIN_PAGE.noAccountPrefix}{" "}
        <StoreBrandTextLink href={SITE_ROUTES.register}>
          {SITE_LOGIN_PAGE.registerCta}
        </StoreBrandTextLink>
      </p>
    </main>
  );
}
