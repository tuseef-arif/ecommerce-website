"use client";

import { useState, type ReactNode } from "react";
import { CheckboxField } from "@/components/ui/checkbox-field";
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
            <CheckboxField
              label="Remember me"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.currentTarget.checked)}
            />
          ) : (
            <span />
          )}
          {forgotPasswordControl}
        </div>
      ) : null}
    </>
  );
};
