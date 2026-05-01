"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const sessionCookieNames = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
] as const;

export const logoutAction = async () => {
  const cookieStore = await cookies();

  for (const cookieName of sessionCookieNames) {
    cookieStore.delete(cookieName);
  }

  redirect("/login?success=Logged%20out%20successfully.");
};
