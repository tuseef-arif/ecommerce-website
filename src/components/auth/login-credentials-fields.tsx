"use client";

import { useState, type ReactNode } from "react";
import { FormInputField } from "@/components/ui/form-input-field";
import { PasswordInputField } from "@/components/ui/password-input-field";
import { SITE_LOGIN_PAGE } from "@/lib/config/site-config";

type LoginCredentialsFieldsProps = {
  defaultEmail?: string;
  onAnyFieldChange?: () => void;
  forgotPasswordControl?: ReactNode;
  showRememberMe?: boolean;
};

export const LoginCredentialsFields = ({
  defaultEmail = "",
  onAnyFieldChange,
  forgotPasswordControl,
  showRememberMe = true,
}: LoginCredentialsFieldsProps) => {
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <>
      <FormInputField
        label={SITE_LOGIN_PAGE.fieldEmailLabel}
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={defaultEmail}
        onChange={onAnyFieldChange}
      />
      <PasswordInputField
        label={SITE_LOGIN_PAGE.fieldPasswordLabel}
        name="password"
        autoComplete="current-password"
        minLength={8}
        required
        onChange={onAnyFieldChange}
      />
      {showRememberMe || forgotPasswordControl ? (
        <div className="flex items-center justify-between gap-2">
          {showRememberMe ? (
            <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-[var(--store-brand-primary)] focus:ring-[var(--store-brand-primary)]"
              />
              Remember me
            </label>
          ) : (
            <span />
          )}
          {forgotPasswordControl}
        </div>
      ) : null}
    </>
  );
};
