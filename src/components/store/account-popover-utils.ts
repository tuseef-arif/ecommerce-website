import type { AccountPopoverUser } from "@/lib/type/account-popover";

export const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const collectFocusables = (root: HTMLElement | null) => {
  if (!root) return [];
  return Array.from(
    root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
};

export const displayNameFromUser = (user: AccountPopoverUser) => {
  const fromParts = [user.firstName?.trim(), user.lastName?.trim()]
    .filter((part): part is string => Boolean(part && part.length > 0))
    .join(" ")
    .trim();
  if (fromParts.length > 0) return fromParts;
  if (user.name?.trim()) return user.name.trim();
  const local = user.email.split("@")[0] ?? user.email;
  return local.length > 0 ? local : user.email;
};

/** Mobile drawer — prefer first name; avoid showing full email when a short label exists */
export const mobileSignedInGreetingFromUser = (user: AccountPopoverUser) => {
  const first = user.firstName?.trim();
  if (first && first.length > 0) return `Hi, ${first}`;
  const display = displayNameFromUser(user);
  const firstToken = display.split(/\s+/)[0]?.trim();
  if (firstToken && firstToken.length > 0) return `Hi, ${firstToken}`;
  return "Hi";
};

export const initialsFromDisplayName = (name: string) => {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
};
