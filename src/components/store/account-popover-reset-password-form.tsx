"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { completePasswordResetAction } from "@/app/(auth)/password-reset-actions";
import type { CompletePasswordResetState } from "@/app/(auth)/password-reset-actions";
import { AuthCrossFooterNeedLogin } from "@/components/store/account-popover-auth-footers";
import {
  guestAuthDialogHeadingClass,
  guestAuthDialogSubtitleClass,
  guestAuthFormClass,
  submitClass,
} from "@/components/store/account-popover-styles";
import { PasswordInputField } from "@/components/ui/password-input-field";

type AccountPopoverResetPasswordFormProps = {
  titleId: string;
  token: string | null;
  initialUrlError?: string | null;
  onGoLogin: () => void;
};

const initialResetState: CompletePasswordResetState = {
  errorMessage: null,
};

export const AccountPopoverResetPasswordForm = ({
  titleId,
  token,
  initialUrlError = null,
  onGoLogin,
}: AccountPopoverResetPasswordFormProps) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hideErrorUntilNextSubmitResult, setHideErrorUntilNextSubmitResult] =
    useState(false);
  const [state, formAction, isPending] = useActionState(
    completePasswordResetAction,
    initialResetState,
  );

  const wasPendingRef = useRef(false);
  useEffect(() => {
    if (wasPendingRef.current && !isPending) {
      setHideErrorUntilNextSubmitResult(false);
    }
    wasPendingRef.current = isPending;
  }, [isPending]);

  const displayError =
    isPending || hideErrorUntilNextSubmitResult
      ? null
      : (state.errorMessage ?? initialUrlError);

  if (!token) {
    return (
      <div>
        <h2 id={titleId} className={guestAuthDialogHeadingClass}>
          Reset Password
        </h2>
        <p className={guestAuthDialogSubtitleClass}>
          This reset link is missing a token.
        </p>
        <p
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700"
          role="alert"
        >
          Request a new password reset link from login.
        </p>
        <AuthCrossFooterNeedLogin onLogin={onGoLogin} />
      </div>
    );
  }

  return (
    <div>
      <h2 id={titleId} className={guestAuthDialogHeadingClass}>
        Reset Password
      </h2>
      <p className={guestAuthDialogSubtitleClass}>Enter your new password.</p>

      {displayError ? (
        <p
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700"
          role="alert"
        >
          {displayError}
        </p>
      ) : null}

      <form
        action={formAction}
        className={guestAuthFormClass}
        onSubmit={() => setHideErrorUntilNextSubmitResult(true)}
      >
        <input type="hidden" name="token" value={token} />
        <PasswordInputField
          label="New password"
          name="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(e) => {
            setHideErrorUntilNextSubmitResult(true);
            setPassword(e.target.value);
          }}
        />
        <PasswordInputField
          label="Confirm new password"
          name="confirmPassword"
          autoComplete="new-password"
          minLength={8}
          required
          value={confirmPassword}
          onChange={(e) => {
            setHideErrorUntilNextSubmitResult(true);
            setConfirmPassword(e.target.value);
          }}
        />
        <button type="submit" className={submitClass} disabled={isPending}>
          {isPending ? "Updating..." : "Update password"}
        </button>
      </form>
      <AuthCrossFooterNeedLogin onLogin={onGoLogin} />
    </div>
  );
};
