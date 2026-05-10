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
import { LoginCredentialsFields } from "@/components/auth/login-credentials-fields";
import { StoreBrandTextLink } from "@/components/ui/store-brand-text-link";
import { SITE_HEADER, SITE_ROUTES } from "@/lib/config/site-config";

export type AccountPopoverLoginFormProps = {
  titleId: string;
  onSignedIn: (redirectUrl?: string | null) => void;
  defaultEmail?: string;
  initialSuccessMessage?: string | null;
  /** Red alert after OAuth redirect (e.g. no matching account). */
  initialOAuthErrorMessage?: string | null;
  onForgotPassword: () => void;
  onGoSignup: () => void;
};

export const AccountPopoverLoginForm = ({
  titleId,
  onSignedIn,
  defaultEmail = "",
  initialSuccessMessage = null,
  initialOAuthErrorMessage = null,
  onForgotPassword,
  onGoSignup,
}: AccountPopoverLoginFormProps) => {
  const [error, setError] = useState<string | null>(() =>
    initialOAuthErrorMessage?.trim() ? initialOAuthErrorMessage.trim() : null,
  );
  const [isCredentialsPending, setIsCredentialsPending] = useState(false);
  const [isGooglePending, setIsGooglePending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(
    () => !initialOAuthErrorMessage?.trim(),
  );

  const dismissError = () => {
    setError(null);
    setShowSuccess(false);
  };

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setIsCredentialsPending(true);
    const email = String(formData.get("email") ?? "").toLowerCase();
    const password = String(formData.get("password") ?? "");

    try {
      const response = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: SITE_ROUTES.postLogin,
      });

      if (!response || response.error) {
        setError(SITE_HEADER.loginPageInvalidCredentials);
        return;
      }

      onSignedIn(response.url);
    } finally {
      setIsCredentialsPending(false);
    }
  };

  const handleGoogleLogin = () => {
    setError(null);
    setIsGooglePending(true);
    void signIn("google", { callbackUrl: SITE_ROUTES.postLogin }).catch(() => {
      setIsGooglePending(false);
      setError("Google sign-in could not start. Please try again.");
    });
  };

  return (
    <div>
      <h2 id={titleId} className={guestAuthDialogHeadingClass}>
        {SITE_HEADER.accountPopoverLoginHeading}
      </h2>
      <p className={guestAuthDialogSubtitleClass}>
        {SITE_HEADER.accountPopoverWelcomeTitle}
      </p>

      {initialSuccessMessage && showSuccess ? (
        <p
          className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-700"
          role="status"
        >
          {initialSuccessMessage}
        </p>
      ) : null}

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
          setShowSuccess(false);
          const fd = new FormData(e.currentTarget);
          await handleSubmit(fd);
        }}
      >
        <LoginCredentialsFields
          defaultEmail={defaultEmail}
          onAnyFieldChange={dismissError}
          forgotPasswordControl={
            <StoreBrandTextLink type="button" onClick={onForgotPassword}>
              {SITE_HEADER.accountPopoverForgotPasswordCta}
            </StoreBrandTextLink>
          }
        />
        <button
          type="submit"
          className={submitClass}
          disabled={isCredentialsPending || isGooglePending}
        >
          {isCredentialsPending ? "Signing in…" : SITE_HEADER.loginCta}
        </button>
      </form>

      <AuthMethodDividerOr />

      <button
        type="button"
        className={googleLoginBtnClass}
        onClick={handleGoogleLogin}
        disabled={isCredentialsPending || isGooglePending}
        aria-busy={isGooglePending}
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
        {isGooglePending
          ? "Signing in…"
          : SITE_HEADER.accountPopoverGoogleLoginCta}
      </button>

      <AuthCrossFooterNeedSignup onSignup={onGoSignup} />
    </div>
  );
};
