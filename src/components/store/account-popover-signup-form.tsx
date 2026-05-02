"use client";

import { signIn } from "next-auth/react";
import { useActionState, useEffect, useRef, type FormEvent } from "react";
import { AuthCrossFooterNeedLogin } from "@/components/store/account-popover-auth-footers";
import {
  guestAuthDialogHeadingClass,
  guestAuthDialogSubtitleClass,
  guestAuthFormClass,
  submitClass,
} from "@/components/store/account-popover-styles";
import { registerAccountInlineAction } from "@/app/(auth)/register/actions";
import { registerPopoverInitialState } from "@/app/(auth)/register/register-popover-state";
import { FormInputField } from "@/components/ui/form-input-field";
import { SITE_HEADER, SITE_ROUTES } from "@/lib/config/site-config";

export type AccountPopoverSignupFormProps = {
  titleId: string;
  onSignedIn: () => void;
  onNeedManualLogin: (email: string) => void;
  onGoLogin: () => void;
};

export const AccountPopoverSignupForm = ({
  titleId,
  onSignedIn,
  onNeedManualLogin,
  onGoLogin,
}: AccountPopoverSignupFormProps) => {
  const [state, formAction, isPending] = useActionState(
    registerAccountInlineAction,
    registerPopoverInitialState,
  );
  const afterRegisterCredentialsRef = useRef<{
    email: string;
    password: string;
  } | null>(null);

  useEffect(() => {
    if (!state.success) return;
    const creds = afterRegisterCredentialsRef.current;
    afterRegisterCredentialsRef.current = null;
    if (!creds) return;

    void (async () => {
      const response = await signIn("credentials", {
        email: creds.email,
        password: creds.password,
        redirect: false,
        callbackUrl: SITE_ROUTES.home,
      });

      if (!response?.error) {
        onSignedIn();
        return;
      }

      onNeedManualLogin(creds.email);
    })();
  }, [state.success, onSignedIn, onNeedManualLogin]);

  return (
    <div>
      <h2 id={titleId} className={guestAuthDialogHeadingClass}>
        {SITE_HEADER.accountPopoverSignupHeading}
      </h2>
      <p className={guestAuthDialogSubtitleClass}>
        {SITE_HEADER.accountPopoverSignupPasswordHelp}
      </p>

      {state.errorMessage ? (
        <p
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700"
          role="alert"
        >
          {state.errorMessage}
        </p>
      ) : null}

      <form
        className={guestAuthFormClass}
        action={formAction}
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          const fd = new FormData(e.currentTarget);
          afterRegisterCredentialsRef.current = {
            email: String(fd.get("email") ?? "").toLowerCase(),
            password: String(fd.get("password") ?? ""),
          };
        }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormInputField
            label="First name"
            name="firstName"
            autoComplete="given-name"
            required
          />
          <FormInputField
            label="Last name"
            name="lastName"
            autoComplete="family-name"
            required
          />
        </div>
        <FormInputField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <FormInputField
          label="Phone number"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          placeholder="Digits only, e.g. 03214385252"
        />
        <FormInputField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <FormInputField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <button type="submit" className={submitClass} disabled={isPending}>
          {isPending ? "Creating account…" : SITE_HEADER.mobileNavSignUpCta}
        </button>
      </form>
      <AuthCrossFooterNeedLogin onLogin={onGoLogin} />
    </div>
  );
};
