import type { RefObject } from "react";
import { FormInputField } from "@/components/ui/form-input-field";
import { PasswordInputField } from "@/components/ui/password-input-field";
import {
  SITE_HEADER,
  SITE_LOGIN_PAGE,
  SITE_REGISTER_PAGE,
} from "@/lib/config/site-config";
import {
  SIGNUP_PASSWORD_FIELD_TITLE,
  SIGNUP_PASSWORD_PATTERN,
} from "@/lib/validation/signup-password-schema";

export type RegisterAccountDetailsFieldsValue = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

type RegisterAccountDetailsFieldsProps = {
  value: RegisterAccountDetailsFieldsValue;
  onFieldChange: (
    field: keyof RegisterAccountDetailsFieldsValue,
    value: string,
  ) => void;
  emailInputRef?: RefObject<HTMLInputElement | null>;
};

export const RegisterAccountDetailsFields = ({
  value,
  onFieldChange,
  emailInputRef,
}: RegisterAccountDetailsFieldsProps) => (
  <>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <FormInputField
        label={SITE_HEADER.accountPopoverFirstNameLabel}
        name="firstName"
        autoComplete="given-name"
        required
        value={value.firstName}
        onChange={(e) => onFieldChange("firstName", e.target.value)}
      />
      <FormInputField
        label={SITE_HEADER.accountPopoverLastNameLabel}
        name="lastName"
        autoComplete="family-name"
        required
        value={value.lastName}
        onChange={(e) => onFieldChange("lastName", e.target.value)}
      />
    </div>
    <FormInputField
      label={SITE_LOGIN_PAGE.fieldEmailLabel}
      name="email"
      type="email"
      autoComplete="email"
      required
      inputRef={emailInputRef}
      value={value.email}
      onChange={(e) => onFieldChange("email", e.target.value)}
    />
    <FormInputField
      label={SITE_HEADER.accountPopoverPhoneLabel}
      name="phone"
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      required
      placeholder={SITE_REGISTER_PAGE.phonePlaceholder}
      value={value.phone}
      onChange={(e) => onFieldChange("phone", e.target.value)}
    />
    <PasswordInputField
      label={SITE_LOGIN_PAGE.fieldPasswordLabel}
      name="password"
      autoComplete="new-password"
      minLength={8}
      maxLength={72}
      required
      title={SIGNUP_PASSWORD_FIELD_TITLE}
      pattern={SIGNUP_PASSWORD_PATTERN}
      value={value.password}
      onChange={(e) => onFieldChange("password", e.target.value)}
    />
    <PasswordInputField
      label={SITE_REGISTER_PAGE.confirmPasswordLabel}
      name="confirmPassword"
      autoComplete="new-password"
      minLength={8}
      maxLength={72}
      required
      title={SIGNUP_PASSWORD_FIELD_TITLE}
      pattern={SIGNUP_PASSWORD_PATTERN}
      value={value.confirmPassword}
      onChange={(e) => onFieldChange("confirmPassword", e.target.value)}
    />
  </>
);
