/**
 * Maps NextAuth `error` query values to safe, user-facing copy for the account popover.
 * Never echoes arbitrary `error` strings from the URL.
 */
export const userFacingMessageForNextAuthError = (
  code: string | null | undefined,
): string => {
  switch (code?.trim()) {
    case "AccessDenied":
      return "No account is registered for that Google email. Create an account first.";
    case "Configuration":
      return "Sign-in is not configured correctly on the server. Try again later or contact support.";
    case "Verification":
      return "This sign-in link has expired or was already used. Please try signing in again.";
    case "OAuthSignin":
    case "OAuthCallback":
      return "Google sign-in could not be completed. Please try again.";
    default:
      return "Sign-in could not be completed. Please try again.";
  }
};
