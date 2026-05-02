"use client";

import { completePasswordResetAction } from "@/app/(auth)/password-reset-actions";
import { FormInputField } from "@/components/ui/form-input-field";

type ResetPasswordFormProps = {
  token: string;
};

export const ResetPasswordForm = ({ token }: ResetPasswordFormProps) => {
  return (
    <form action={completePasswordResetAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <FormInputField
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <FormInputField
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />

      <button
        type="submit"
        className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
      >
        Update password
      </button>
    </form>
  );
};
