/**
 * Pure helpers for shaping customer display values across server data access
 * and client-rendered components. Keep free of `server-only` imports so it is
 * safe to use from client components.
 */

export const composeCustomerDisplayName = (input: {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}): string => {
  const first = (input.firstName ?? "").trim();
  const last = (input.lastName ?? "").trim();
  const composed = [first, last].filter((part) => part.length > 0).join(" ");
  return composed.length > 0 ? composed : input.email;
};
