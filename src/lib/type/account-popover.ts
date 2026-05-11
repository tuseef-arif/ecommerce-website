import type { UserRole } from "@/generated/prisma/enums";
import type { RefObject } from "react";

export type AccountPopoverUser = {
  email: string;
  role: UserRole;
  name?: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  /** Public path under `public/`, e.g. `/uploads/profile-images/…` */
  profileImagePath?: string | null;
};

export type AccountPopoverProps = {
  isOpen: boolean;
  isLoggedIn: boolean;
  user: AccountPopoverUser | null;
  isAdmin: boolean;
  initialGuestView?: GuestView;
  loginNoticeMessage?: string | null;
  loginOAuthErrorMessage?: string | null;
  signupUrlError?: string | null;
  resetPasswordToken?: string | null;
  resetPasswordUrlError?: string | null;
  onLogoutSuccess?: () => void;
  onClose: () => void;
  onNavigate?: () => void;
  triggerRef: RefObject<HTMLElement | null>;
};

export type GuestView = "login" | "signup" | "forgot" | "reset";
