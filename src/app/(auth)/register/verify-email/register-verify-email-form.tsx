"use client";

import { useState } from "react";
import { FormInputField } from "@/components/ui/form-input-field";
import { SITE_REGISTER_VERIFY_PAGE } from "@/lib/config/site-config";
import { completeRegisterWithOtpAction } from "../actions";

type RegisterVerifyEmailFormProps = {
  email: string;
  /** Error shown after redirect (?error=) */
  initialError: string | null;
};

export const RegisterVerifyEmailForm = ({
  email,
  initialError,
}: RegisterVerifyEmailFormProps) => {
  const [code, setCode] = useState("");
  const [hideErrorAfterEdit, setHideErrorAfterEdit] = useState(false);

  const displayError =
    initialError && !hideErrorAfterEdit ? initialError : null;

  return (
    <>
      {displayError ? (
        <p className="auth-page-alert auth-page-alert--error" role="alert">
          {displayError}
        </p>
      ) : null}

      <form action={completeRegisterWithOtpAction} className="space-y-4">
        <input type="hidden" name="email" value={email} />
        <FormInputField
          label={SITE_REGISTER_VERIFY_PAGE.codeLabel}
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          required
          placeholder="000000"
          aria-describedby="register-otp-hint"
          value={code}
          onChange={(e) => {
            setHideErrorAfterEdit(true);
            setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
          }}
        />
        <p id="register-otp-hint" className="text-xs text-neutral-500">
          {SITE_REGISTER_VERIFY_PAGE.codeHint}
        </p>
        <button type="submit" className="auth-page-primary-btn">
          {SITE_REGISTER_VERIFY_PAGE.submitCta}
        </button>
      </form>
    </>
  );
};
