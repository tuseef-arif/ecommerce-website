import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { StoreBrandTextLink } from "@/components/ui/store-brand-text-link";
import {
  SITE_REGISTER_PAGE,
  SITE_REGISTER_VERIFY_PAGE,
  SITE_ROUTES,
  STORE_BUSINESS_NAME,
} from "@/lib/config/site-config";
import { RegisterVerifyEmailForm } from "./register-verify-email-form";

export const metadata: Metadata = {
  title: `Verify email | ${STORE_BUSINESS_NAME}`,
  description: SITE_REGISTER_VERIFY_PAGE.metaDescription.replace(
    "{business}",
    STORE_BUSINESS_NAME,
  ),
};

type PageProps = {
  searchParams: Promise<{ email?: string; error?: string }>;
};

const emailParamSchema = z.string().trim().email();

export default async function RegisterVerifyEmailPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const rawEmail = typeof params.email === "string" ? params.email : "";
  const parsedEmail = emailParamSchema.safeParse(rawEmail);

  if (!parsedEmail.success) {
    redirect(
      `${SITE_ROUTES.register}?error=${encodeURIComponent("Please start registration from the create account form.")}`,
    );
  }

  const email = parsedEmail.data.toLowerCase();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-900">
          {SITE_REGISTER_VERIFY_PAGE.heading}
        </h1>
        <p className="auth-page-lead">{SITE_REGISTER_VERIFY_PAGE.intro}</p>
        <p className="text-sm text-neutral-600">
          Sending to{" "}
          <span className="font-medium text-neutral-800">{email}</span>
        </p>
      </section>

      <RegisterVerifyEmailForm
        email={email}
        initialError={params.error ?? null}
      />

      <p className="auth-page-lead">
        <StoreBrandTextLink href={SITE_ROUTES.register}>
          {SITE_REGISTER_VERIFY_PAGE.backToRegisterCta}
        </StoreBrandTextLink>
        {" · "}
        <StoreBrandTextLink href={SITE_ROUTES.login}>
          {SITE_REGISTER_PAGE.loginLinkCta}
        </StoreBrandTextLink>
      </p>
    </main>
  );
}
