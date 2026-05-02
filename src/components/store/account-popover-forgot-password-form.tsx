"use client";

import { useActionState } from "react";
import { AuthCrossFooterNeedLogin } from "@/components/store/account-popover-auth-footers";
import {
  guestAuthDialogHeadingClass,
  guestAuthDialogSubtitleClass,
  guestAuthFormClass,
  submitClass,
} from "@/components/store/account-popover-styles";
import { requestPasswordResetInlineAction } from "@/app/(auth)/password-reset-actions";
import { requestPasswordResetPopoverInitialState } from "@/app/(auth)/password-reset-popover-state";
import { FormInputField } from "@/components/ui/form-input-field";
import { StoreBrandTextLink } from "@/components/ui/store-brand-text-link";
import { SITE_HEADER } from "@/lib/config/site-config";

export type AccountPopoverForgotPasswordFormProps = {
  titleId: string;
  onGoLogin: () => void;
};

export const AccountPopoverForgotPasswordForm = ({
  titleId,
  onGoLogin,
}: AccountPopoverForgotPasswordFormProps) => {
  const [state, formAction, isPending] = useActionState(
    requestPasswordResetInlineAction,
    requestPasswordResetPopoverInitialState,
  );

  return (
    <div>
      <h2 id={titleId} className={guestAuthDialogHeadingClass}>
        {SITE_HEADER.accountPopoverForgotHeading}
      </h2>
      <p className={guestAuthDialogSubtitleClass}>
        {SITE_HEADER.accountPopoverForgotIntro}
      </p>

      {state.errorMessage ? (
        <p
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700"
          role="alert"
        >
          {state.errorMessage}
        </p>
      ) : null}

      {state.success ? (
        <div className="mt-5 space-y-4 text-center">
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {SITE_HEADER.accountPopoverResetEmailSent}
          </p>
          <StoreBrandTextLink type="button" onClick={onGoLogin}>
            {SITE_HEADER.accountPopoverBackToLogin}
          </StoreBrandTextLink>
        </div>
      ) : (
        <>
          <form className={guestAuthFormClass} action={formAction}>
            <FormInputField
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
            <button type="submit" className={submitClass} disabled={isPending}>
              {isPending
                ? "Sending…"
                : SITE_HEADER.accountPopoverSendResetLinkCta}
            </button>
          </form>
          <AuthCrossFooterNeedLogin onLogin={onGoLogin} />
        </>
      )}
    </div>
  );
};
