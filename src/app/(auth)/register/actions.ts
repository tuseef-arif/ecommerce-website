"use server";

import { redirect } from "next/navigation";
import { registerAccountSchema } from "@/lib/validation/register-account-schema";
import { createRegisteredUser } from "./register-user";
import type { RegisterPopoverState } from "./register-popover-state";

export const registerAction = async (formData: FormData) => {
  const parsedData = registerAccountSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsedData.success) {
    const message = encodeURIComponent(
      parsedData.error.issues[0]?.message ?? "Invalid input.",
    );
    redirect(`/register?error=${message}`);
  }

  const result = await createRegisteredUser(parsedData.data);

  if (!result.ok) {
    if (result.error === "EMAIL_TAKEN") {
      redirect("/register?error=Email%20is%20already%20registered.");
    }
    redirect(
      "/register?error=Something%20went%20wrong.%20Please%20try%20again.",
    );
  }

  redirect("/login?success=Account%20created%20successfully.");
};

/**
 * Registration for the header account popover — returns state instead of redirecting.
 */
export const registerAccountInlineAction = async (
  _prev: RegisterPopoverState,
  formData: FormData,
): Promise<RegisterPopoverState> => {
  const parsedData = registerAccountSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsedData.success) {
    return {
      errorMessage:
        parsedData.error.issues[0]?.message ??
        "Please check the form and try again.",
      success: false,
      emailForLogin: undefined,
    };
  }

  const result = await createRegisteredUser(parsedData.data);

  if (!result.ok) {
    if (result.error === "EMAIL_TAKEN") {
      return {
        errorMessage: "That email is already registered.",
        success: false,
        emailForLogin: undefined,
      };
    }
    return {
      errorMessage: "Something went wrong. Please try again.",
      success: false,
      emailForLogin: undefined,
    };
  }

  return {
    errorMessage: null,
    success: true,
    emailForLogin: parsedData.data.email.toLowerCase(),
  };
};
