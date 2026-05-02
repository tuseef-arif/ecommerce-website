import type { Metadata } from "next";
import { FormInputField } from "@/components/ui/form-input-field";
import { StoreBrandTextLink } from "@/components/ui/store-brand-text-link";
import {
  SITE_HEADER,
  SITE_LOGIN_PAGE,
  SITE_REGISTER_PAGE,
  SITE_ROUTES,
  STORE_BUSINESS_NAME,
} from "@/lib/config/site-config";
import { registerAction } from "./actions";

export const metadata: Metadata = {
  title: `Register | ${STORE_BUSINESS_NAME}`,
  description: SITE_REGISTER_PAGE.metaDescription.replace(
    "{business}",
    STORE_BUSINESS_NAME,
  ),
};

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
        <h1 className="text-2xl font-semibold text-neutral-900">
          {SITE_REGISTER_PAGE.heading}
        </h1>
        <p className="auth-page-lead">{SITE_REGISTER_PAGE.intro}</p>
      </section>

      {params.error ? (
        <p className="auth-page-alert auth-page-alert--error" role="alert">
          {params.error}
        </p>
      ) : null}

      <form action={registerAction} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInputField
            label={SITE_HEADER.accountPopoverFirstNameLabel}
            name="firstName"
            type="text"
            autoComplete="given-name"
            required
          />
          <FormInputField
            label={SITE_HEADER.accountPopoverLastNameLabel}
            name="lastName"
            type="text"
            autoComplete="family-name"
            required
          />
        </div>
        <FormInputField
          label={SITE_LOGIN_PAGE.fieldEmailLabel}
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <FormInputField
          label={SITE_HEADER.accountPopoverPhoneLabel}
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          required
          placeholder={SITE_REGISTER_PAGE.phonePlaceholder}
        />
        <FormInputField
          label={SITE_LOGIN_PAGE.fieldPasswordLabel}
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <FormInputField
          label={SITE_REGISTER_PAGE.confirmPasswordLabel}
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />

        <button type="submit" className="auth-page-primary-btn">
          {SITE_REGISTER_PAGE.submitCta}
        </button>
      </form>

      <p className="auth-page-lead">
        {SITE_REGISTER_PAGE.hasAccountPrefix}{" "}
        <StoreBrandTextLink href={SITE_ROUTES.login}>
          {SITE_REGISTER_PAGE.loginLinkCta}
        </StoreBrandTextLink>
      </p>
    </main>
  );
}
