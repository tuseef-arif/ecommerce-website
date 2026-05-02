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
  const [logoutSuccessOpen, setLogoutSuccessOpen] = useState(false);

  const handleNavigate = useCallback(() => {
    onNavigate?.();
    onClose();
  }, [onClose, onNavigate]);

  const finalizeAuthSuccess = useCallback(() => {
    setAuthSuccessOpen(false);
    onNavigate?.();
    onClose();
    router.refresh();
  }, [onClose, onNavigate, router]);

  const finalizeLogoutSuccess = useCallback(() => {
    setLogoutSuccessOpen(false);
    onNavigate?.();
    onClose();
    router.refresh();
  }, [onClose, onNavigate, router]);

  const handleSignedIn = useCallback(() => {
    setAuthSuccessOpen(true);
  }, []);

  const handleLogoutSuccess = useCallback(() => {
    setLogoutSuccessOpen(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      setGuestView("login");
      setLoginEmailHint("");
      setForgotFormKey(0);
      setAuthSuccessOpen(false);
      setLogoutSuccessOpen(false);
    });
  }, [isOpen]);

  const successSheetOpen = authSuccessOpen || logoutSuccessOpen;

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
    "rounded-2xl border border-neutral-200 bg-white p-5 text-neutral-900 shadow-lg ring-1 ring-black/5 md:p-6";

  const guestBody = !isLoggedIn ? (
    <div className="flex w-full flex-col">
      <div className="flex flex-1 flex-col items-center pt-2">
        <div className="w-full max-w-sm">
          {guestView === "login" ? (
            <AccountPopoverLoginForm
              titleId={titleId}
              key={loginEmailHint || "login-default"}
              onSignedIn={handleSignedIn}
              defaultEmail={loginEmailHint}
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
        </div>
      </div>
    </div>
  ) : null;

  const signedInBody =
    isLoggedIn && user ? (
      <AccountPopoverSignedInMenu
        user={user}
        titleId={titleId}
        isAdmin={isAdmin}
        onNavigate={handleNavigate}
        onLogoutSuccess={handleLogoutSuccess}
      />
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
      <StoreAuthSuccessDialog
        isOpen={logoutSuccessOpen}
        onDismiss={finalizeLogoutSuccess}
        title={SITE_HEADER.accountLogoutSuccessTitle}
        message={SITE_HEADER.accountLogoutSuccessMessage}
        titleAccent="wave"
      />
      {!successSheetOpen ? (
        <div className="fixed inset-0 z-[70]" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-black/45 transition-opacity"
            aria-label={SITE_HEADER.accountSheetCloseAria}
            onClick={onClose}
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 py-[max(1rem,env(safe-area-inset-top))]">
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
