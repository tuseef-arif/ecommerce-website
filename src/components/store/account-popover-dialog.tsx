"use client";

import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ACCOUNT_POPOVER_ELEMENT_ID } from "@/components/store/account-popover-constants";
import { AccountPopoverForgotPasswordForm } from "@/components/store/account-popover-forgot-password-form";
import { AccountPopoverLoginForm } from "@/components/store/account-popover-login-form";
import { AccountPopoverResetPasswordForm } from "@/components/store/account-popover-reset-password-form";
import { AccountPopoverSignupForm } from "@/components/store/account-popover-signup-form";
import { AccountPopoverSignedInMenu } from "@/components/store/account-popover-signed-in-menu";
import { StoreAuthSuccessDialog } from "@/components/store/store-auth-success-dialog";
import { accountPopoverCloseButtonClass } from "@/components/store/account-popover-styles";
import type {
  AccountPopoverProps,
  GuestView,
} from "@/lib/type/account-popover";
import { collectFocusables } from "@/components/store/account-popover-utils";
import { IconX } from "@/components/icons";
import { SITE_HEADER } from "@/lib/config/site-config";

/**
 * Centered account dialog (guest or signed-in), portaled over the viewport on all breakpoints.
 */
export const AccountPopover = ({
  isOpen,
  isLoggedIn,
  user,
  isAdmin,
  initialGuestView = "login",
  loginNoticeMessage = null,
  loginOAuthErrorMessage = null,
  signupUrlError = null,
  resetPasswordToken = null,
  resetPasswordUrlError = null,
  onLogoutSuccess,
  onClose,
  onNavigate,
  triggerRef,
}: AccountPopoverProps) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);
  const router = useRouter();
  const [guestView, setGuestView] = useState<GuestView>("login");
  const [loginEmailHint, setLoginEmailHint] = useState("");
  const [forgotFormKey, setForgotFormKey] = useState(0);
  const [authSuccessOpen, setAuthSuccessOpen] = useState(false);
  const [authRedirectUrl, setAuthRedirectUrl] = useState<string | null>(null);

  const handleNavigate = useCallback(() => {
    onNavigate?.();
    onClose();
  }, [onClose, onNavigate]);

  const finalizeAuthSuccess = useCallback(() => {
    setAuthSuccessOpen(false);
    onNavigate?.();
    onClose();
    if (authRedirectUrl) {
      router.replace(authRedirectUrl);
      router.refresh();
      return;
    }
    router.refresh();
  }, [authRedirectUrl, onClose, onNavigate, router]);

  const handleSignedIn = useCallback(
    (redirectUrl?: string | null) => {
      setAuthRedirectUrl(redirectUrl ?? null);
      setAuthSuccessOpen(true);
      // Ensure header/session-driven UI updates immediately after auth success,
      // so clicking account again does not show stale signed-out content.
      router.refresh();
    },
    [router],
  );

  const handleLogoutSuccess = useCallback(() => {
    onClose();
    onLogoutSuccess?.();
  }, [onClose, onLogoutSuccess]);

  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      if (resetPasswordToken) {
        setGuestView("reset");
        return;
      }
      setGuestView(initialGuestView);
      setLoginEmailHint("");
      setForgotFormKey(0);
      setAuthSuccessOpen(false);
      setAuthRedirectUrl(null);
    });
  }, [isOpen, resetPasswordToken, initialGuestView]);

  const successSheetOpen = authSuccessOpen;

  useLayoutEffect(() => {
    if (!isOpen || successSheetOpen || !panelRef.current) return;
    const focusables = collectFocusables(panelRef.current);
    queueMicrotask(() => focusables[0]?.focus());
  }, [isOpen, successSheetOpen, guestView, isLoggedIn]);

  useEffect(() => {
    if (wasOpenRef.current && !isOpen) {
      queueMicrotask(() => triggerRef.current?.focus());
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, triggerRef]);

  useEffect(() => {
    if (!isOpen || successSheetOpen || !panelRef.current) return undefined;

    const panel = panelRef.current;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== "Tab") return;

      const focusables = collectFocusables(panel);
      if (focusables.length === 0) return;

      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    panel.addEventListener("keydown", onKeyDown);
    return () => panel.removeEventListener("keydown", onKeyDown);
  }, [isOpen, successSheetOpen, onClose]);

  if (!isOpen) return null;

  const cardSurfaceClass =
    "flex max-h-[calc(100dvh-2rem)] min-h-[30rem] flex-col overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-5 text-neutral-900 shadow-lg ring-1 ring-black/5 md:min-h-[34rem] md:p-6";

  const guestBody = !isLoggedIn ? (
    <div className="flex min-h-full w-full flex-1 flex-col justify-center py-4">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="w-full max-w-sm">
          {guestView === "login" ? (
            <AccountPopoverLoginForm
              titleId={titleId}
              key={`${loginEmailHint || "login"}|${loginOAuthErrorMessage ?? ""}`}
              onSignedIn={handleSignedIn}
              defaultEmail={loginEmailHint}
              initialSuccessMessage={loginNoticeMessage}
              initialOAuthErrorMessage={loginOAuthErrorMessage}
              onForgotPassword={() => {
                setForgotFormKey((k) => k + 1);
                setGuestView("forgot");
              }}
              onGoSignup={() => setGuestView("signup")}
            />
          ) : null}
          {guestView === "signup" ? (
            <AccountPopoverSignupForm
              titleId={titleId}
              initialUrlError={signupUrlError}
              onSignedIn={handleSignedIn}
              onNeedManualLogin={(email) => {
                setLoginEmailHint(email);
                setGuestView("login");
              }}
              onGoLogin={() => setGuestView("login")}
            />
          ) : null}
          {guestView === "forgot" ? (
            <AccountPopoverForgotPasswordForm
              titleId={titleId}
              key={forgotFormKey}
              onGoLogin={() => setGuestView("login")}
            />
          ) : null}
          {guestView === "reset" ? (
            <AccountPopoverResetPasswordForm
              titleId={titleId}
              token={resetPasswordToken}
              initialUrlError={resetPasswordUrlError}
              onGoLogin={() => setGuestView("login")}
            />
          ) : null}
        </div>
      </div>
    </div>
  ) : null;

  const signedInBody =
    isLoggedIn && user ? (
      <div className="flex min-h-full w-full flex-1 flex-col justify-center py-4">
        <AccountPopoverSignedInMenu
          user={user}
          titleId={titleId}
          isAdmin={isAdmin}
          onNavigate={handleNavigate}
          onLogoutSuccess={handleLogoutSuccess}
        />
      </div>
    ) : null;

  const inner = (
    <div
      ref={panelRef}
      id={ACCOUNT_POPOVER_ELEMENT_ID}
      role="dialog"
      aria-modal={true}
      aria-labelledby={titleId}
      tabIndex={-1}
      className={`account-popover-modal relative outline-none ${cardSurfaceClass}`.trim()}
    >
      {!isLoggedIn ? guestBody : signedInBody}
      <button
        type="button"
        className={accountPopoverCloseButtonClass}
        aria-label={SITE_HEADER.accountSheetCloseAria}
        onClick={onClose}
      >
        <IconX width={18} height={18} className="shrink-0" strokeWidth={2.5} />
      </button>
    </div>
  );

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <StoreAuthSuccessDialog
        isOpen={authSuccessOpen}
        onDismiss={finalizeAuthSuccess}
        message={
          guestView === "signup"
            ? SITE_HEADER.accountAuthSuccessMessageAfterRegister
            : undefined
        }
      />
      {!successSheetOpen ? (
        <div className="fixed inset-0 z-[70]" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-black/45 transition-opacity"
            aria-label={SITE_HEADER.accountSheetCloseAria}
            onClick={onClose}
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="pointer-events-auto w-full max-w-md md:max-w-lg">
              {inner}
            </div>
          </div>
        </div>
      ) : null}
    </>,
    document.body,
  );
};
