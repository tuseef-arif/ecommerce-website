"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { FormInputField } from "@/components/ui/form-input-field";
import {
  SITE_HEADER,
  SITE_LOGIN_PAGE,
  SITE_ROUTES,
} from "@/lib/config/site-config";

export const LoginForm = () => {
  const [error, setError] = useState<string | null>(null);

  const dismissError = () => {
    setError(null);
  };

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    const email = String(formData.get("email") ?? "").toLowerCase();
    const password = String(formData.get("password") ?? "");

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

    window.location.href = SITE_ROUTES.home;
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit(new FormData(e.currentTarget));
      }}
    >
      {error ? (
        <p className="auth-page-alert auth-page-alert--error" role="alert">
          {error}
        </p>
      ) : null}

      <FormInputField
        label={SITE_LOGIN_PAGE.fieldEmailLabel}
        name="email"
        type="email"
        required
        onChange={dismissError}
      />
      <FormInputField
        label={SITE_LOGIN_PAGE.fieldPasswordLabel}
        name="password"
        type="password"
        minLength={8}
        required
        onChange={dismissError}
      />

      <button type="submit" className="auth-page-primary-btn">
        {SITE_HEADER.loginCta}
      </button>
    </form>
  );
};
