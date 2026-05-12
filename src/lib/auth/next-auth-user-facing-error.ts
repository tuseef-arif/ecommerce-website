/**
 * Maps NextAuth `error` query values to safe, user-facing copy for the account popover.
 * Never echoes arbitrary `error` strings from the URL.
 */
export const userFacingMessageForNextAuthError = (
  code: string | null | undefined,
): string => {
  switch (code?.trim()) {
    case "AccessDenied":
      return "Google sign-in is not available for this email. The account may be inactive, or something went wrong. Try again or use email and password.";
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
