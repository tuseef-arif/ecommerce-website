"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";
import { useState } from "react";
import {
  AuthCrossFooterNeedSignup,
  AuthMethodDividerOr,
} from "@/components/store/account-popover-auth-footers";
import {
  guestAuthDialogHeadingClass,
  guestAuthDialogSubtitleClass,
  guestAuthFormClass,
  googleLoginBtnClass,
  submitClass,
} from "@/components/store/account-popover-styles";
import { FormInputField } from "@/components/ui/form-input-field";
import { StoreBrandTextLink } from "@/components/ui/store-brand-text-link";
import { SITE_HEADER, SITE_ROUTES } from "@/lib/config/site-config";

export type AccountPopoverLoginFormProps = {
  titleId: string;
  onSignedIn: () => void;
  defaultEmail?: string;
  onForgotPassword: () => void;
  onGoSignup: () => void;
};

export const AccountPopoverLoginForm = ({
  titleId,
  onSignedIn,
  defaultEmail = "",
  onForgotPassword,
  onGoSignup,
}: AccountPopoverLoginFormProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const dismissError = () => {
    setError(null);
  };

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setIsPending(true);
    const email = String(formData.get("email") ?? "").toLowerCase();
    const password = String(formData.get("password") ?? "");

    try {
      const response = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: SITE_ROUTES.home,
      });

      if (!response || response.error) {
        setError(SITE_HEADER.loginPageInvalidCredentials);
        return;
      }

      onSignedIn();
    } finally {
      setIsPending(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsPending(true);

    try {
      const response = await signIn("google", {
        redirect: false,
        callbackUrl: SITE_ROUTES.home,
      });

      if (!response || response.error) {
        setError("Google login is not available right now.");
        return;
      }

      onSignedIn();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div>
      <h2 id={titleId} className={guestAuthDialogHeadingClass}>
        {SITE_HEADER.accountPopoverLoginHeading}
      </h2>
      <p className={guestAuthDialogSubtitleClass}>
        {SITE_HEADER.accountPopoverWelcomeTitle}
      </p>

      {error ? (
        <p
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <form
        className={guestAuthFormClass}
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          await handleSubmit(fd);
        }}
      >
        <FormInputField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={defaultEmail}
          onChange={dismissError}
        />
        <FormInputField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={8}
          required
          onChange={dismissError}
        />
        <div className="flex items-center justify-between gap-2">
          <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-[var(--store-brand-primary)] focus:ring-[var(--store-brand-primary)]"
            />
            Remember me
          </label>
          <StoreBrandTextLink type="button" onClick={onForgotPassword}>
            {SITE_HEADER.accountPopoverForgotPasswordCta}
          </StoreBrandTextLink>
        </div>
        <button type="submit" className={submitClass} disabled={isPending}>
          {isPending ? "Signing in…" : SITE_HEADER.loginCta}
        </button>
      </form>

      <AuthMethodDividerOr />

      <button
        type="button"
        className={googleLoginBtnClass}
        onClick={handleGoogleLogin}
        aria-label={SITE_HEADER.accountPopoverGoogleLoginCta}
      >
        <Image
          src="/assets/google-color.svg"
          alt=""
          width={20}
          height={20}
          className="h-5 w-5 shrink-0"
          aria-hidden
        />
        {SITE_HEADER.accountPopoverGoogleLoginCta}
      </button>

      <AuthCrossFooterNeedSignup onSignup={onGoSignup} />
    </div>
  );
};
