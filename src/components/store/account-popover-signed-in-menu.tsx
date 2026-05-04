"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import {
  clearSessionCookiesAction,
  updateAccountProfileAction,
  updateAccountPasswordAction,
} from "@/app/(shop)/actions";
import {
  googleLoginBtnFullWidthClass,
  submitFullWidthClass,
} from "@/components/store/account-popover-styles";
import type { AccountPopoverUser } from "@/lib/type/account-popover";
import {
  displayNameFromUser,
  initialsFromDisplayName,
} from "@/components/store/account-popover-utils";
import { FormInputField } from "@/components/ui/form-input-field";
import { PasswordInputField } from "@/components/ui/password-input-field";
import { SITE_HEADER, SITE_ROUTES } from "@/lib/config/site-config";
import { IconMail, IconPhone } from "@/components/icons";
import {
  SIGNUP_PASSWORD_FIELD_TITLE,
  SIGNUP_PASSWORD_PATTERN,
} from "@/lib/validation/signup-password-schema";

export type AccountPopoverSignedInMenuProps = {
  user: AccountPopoverUser;
  titleId: string;
  isAdmin: boolean;
  onNavigate: () => void;
  /** Called after session cookies are cleared — parent shows logout success sheet. */
  onLogoutSuccess: () => void;
};

export const AccountPopoverSignedInMenu = ({
  user,
  titleId,
  isAdmin,
  onNavigate,
  onLogoutSuccess,
}: AccountPopoverSignedInMenuProps) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordEditing, setIsPasswordEditing] = useState(false);
  const [firstName, setFirstName] = useState(user.firstName?.trim() ?? "");
  const [lastName, setLastName] = useState(user.lastName?.trim() ?? "");
  const [phone, setPhone] = useState(user.phone?.trim() ?? "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDetailsUpdatedFlash, setShowDetailsUpdatedFlash] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!showDetailsUpdatedFlash) return;
    const id = window.setTimeout(() => {
      setShowDetailsUpdatedFlash(false);
    }, 3000);
    return () => window.clearTimeout(id);
  }, [showDetailsUpdatedFlash]);

  const displayLine = displayNameFromUser(user);
  const avatarInitials = initialsFromDisplayName(displayLine);
  const phoneDisplay =
    user.phone?.trim() && user.phone.trim().length > 0
      ? user.phone.trim()
      : SITE_HEADER.accountPopoverPhoneEmpty;

  const actionButtonClass =
    "flex min-h-10 w-full items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-[var(--store-brand-primary)] transition-colors hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)] disabled:cursor-not-allowed disabled:opacity-60";
  const actionButtonNavyClass =
    "flex min-h-10 w-full items-center justify-center rounded-lg border border-[var(--store-brand-primary)] bg-[var(--store-brand-primary)] px-3 py-2 text-sm font-semibold text-white transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)] disabled:cursor-not-allowed disabled:opacity-60";

  const baselineFirst = user.firstName?.trim() ?? "";
  const baselineLast = user.lastName?.trim() ?? "";
  const baselinePhone = user.phone?.trim() ?? "";

  const hasProfileChanges =
    firstName.trim() !== baselineFirst ||
    lastName.trim() !== baselineLast ||
    phone.trim() !== baselinePhone;

  const canSubmitPassword =
    oldPassword.trim().length > 0 &&
    newPassword.trim().length > 0 &&
    confirmNewPassword.trim().length > 0;

  const openEdit = () => {
    setFirstName(user.firstName?.trim() ?? "");
    setLastName(user.lastName?.trim() ?? "");
    setPhone(user.phone?.trim() ?? "");
    setSaveError(null);
    setIsPasswordEditing(false);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setFirstName(user.firstName?.trim() ?? "");
    setLastName(user.lastName?.trim() ?? "");
    setPhone(user.phone?.trim() ?? "");
    setSaveError(null);
    setIsEditing(false);
  };

  const openPasswordEdit = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setSaveError(null);
    setIsEditing(false);
    setIsPasswordEditing(true);
  };

  const cancelPasswordEdit = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setSaveError(null);
    setIsPasswordEditing(false);
  };

  const handleLogout = () => {
    startTransition(async () => {
      const result = await clearSessionCookiesAction();
      if (result.ok) {
        onLogoutSuccess();
      }
    });
  };

  const handleProfileSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!hasProfileChanges) return;
    setSaveError(null);
    const form = e.currentTarget;
    startTransition(async () => {
      const fd = new FormData(form);
      const result = await updateAccountProfileAction(fd);
      if (!result.ok) {
        setSaveError(
          result.error || SITE_HEADER.accountPopoverProfileUpdateError,
        );
        return;
      }
      setIsEditing(false);
      setShowDetailsUpdatedFlash(true);
      router.refresh();
    });
  };

  const handlePasswordSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmitPassword) return;
    setSaveError(null);
    const form = e.currentTarget;
    startTransition(async () => {
      const fd = new FormData(form);
      const result = await updateAccountPasswordAction(fd);
      if (!result.ok) {
        setSaveError(result.error);
        return;
      }
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setIsPasswordEditing(false);
      setShowDetailsUpdatedFlash(true);
    });
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      {isEditing ? (
        <div className="mx-auto w-full max-w-sm">
          <form className="space-y-4" onSubmit={handleProfileSubmit}>
            <h2
              id={titleId}
              className="text-center text-2xl font-bold text-[var(--store-brand-primary)]"
            >
              {SITE_HEADER.accountPopoverSignedInEditHeading}
            </h2>

            {saveError ? (
              <p
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700"
                role="alert"
              >
                {saveError}
              </p>
            ) : null}

            <FormInputField
              label={SITE_HEADER.accountPopoverFirstNameLabel}
              name="firstName"
              autoComplete="given-name"
              value={firstName}
              onChange={(ev) => {
                setFirstName(ev.target.value);
                setSaveError(null);
              }}
            />
            <FormInputField
              label={SITE_HEADER.accountPopoverLastNameLabel}
              name="lastName"
              autoComplete="family-name"
              value={lastName}
              onChange={(ev) => {
                setLastName(ev.target.value);
                setSaveError(null);
              }}
            />
            <FormInputField
              label={SITE_HEADER.accountPopoverPhoneLabel}
              name="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(ev) => {
                setPhone(ev.target.value);
                setSaveError(null);
              }}
            />

            <div className="grid w-full grid-cols-2 gap-3 pt-2">
              <button
                type="submit"
                className={submitFullWidthClass}
                disabled={isPending || !hasProfileChanges}
              >
                {isPending
                  ? "Updating..."
                  : SITE_HEADER.accountPopoverSaveProfileCta}
              </button>
              <button
                type="button"
                className={googleLoginBtnFullWidthClass}
                disabled={isPending}
                onClick={cancelEdit}
              >
                {SITE_HEADER.accountPopoverCancelEditCta}
              </button>
            </div>
          </form>
        </div>
      ) : isPasswordEditing ? (
        <div className="mx-auto w-full max-w-sm">
          <form className="space-y-4" onSubmit={handlePasswordSubmit}>
            <h2
              id={titleId}
              className="text-center text-2xl font-bold text-[var(--store-brand-primary)]"
            >
              {SITE_HEADER.accountPopoverPasswordUpdateHeading}
            </h2>

            {saveError ? (
              <p
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700"
                role="alert"
              >
                {saveError}
              </p>
            ) : null}

            <PasswordInputField
              label={SITE_HEADER.accountPopoverOldPasswordLabel}
              name="oldPassword"
              autoComplete="current-password"
              minLength={8}
              value={oldPassword}
              onChange={(ev) => {
                setOldPassword(ev.target.value);
                setSaveError(null);
              }}
            />
            <PasswordInputField
              label={SITE_HEADER.accountPopoverNewPasswordLabel}
              name="newPassword"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              title={SIGNUP_PASSWORD_FIELD_TITLE}
              pattern={SIGNUP_PASSWORD_PATTERN}
              value={newPassword}
              onChange={(ev) => {
                setNewPassword(ev.target.value);
                setSaveError(null);
              }}
            />
            <PasswordInputField
              label={SITE_HEADER.accountPopoverConfirmNewPasswordLabel}
              name="confirmNewPassword"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              title={SIGNUP_PASSWORD_FIELD_TITLE}
              pattern={SIGNUP_PASSWORD_PATTERN}
              value={confirmNewPassword}
              onChange={(ev) => {
                setConfirmNewPassword(ev.target.value);
                setSaveError(null);
              }}
            />

            <div className="grid w-full grid-cols-2 gap-3 pt-2">
              <button
                type="submit"
                className={submitFullWidthClass}
                disabled={isPending || !canSubmitPassword}
              >
                {isPending
                  ? "Updating..."
                  : SITE_HEADER.accountPopoverSavePasswordCta}
              </button>
              <button
                type="button"
                className={googleLoginBtnFullWidthClass}
                disabled={isPending}
                onClick={cancelPasswordEdit}
              >
                {SITE_HEADER.accountPopoverCancelEditCta}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-md">
          <section className="rounded-2xl bg-white p-5 text-center">
            <h2 id={titleId} className="sr-only">
              {displayLine}
            </h2>

            {showDetailsUpdatedFlash ? (
              <p
                className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-center text-sm font-medium text-emerald-800"
                role="status"
                aria-live="polite"
              >
                {SITE_HEADER.accountPopoverDetailsUpdatedMessage}
              </p>
            ) : null}

            <div className="relative mx-auto w-fit">
              <div
                className="flex h-28 w-28 items-center justify-center rounded-full bg-[var(--store-brand-primary)] text-2xl font-bold text-white"
                aria-hidden
              >
                {avatarInitials}
              </div>
            </div>

            <p className="mt-4 truncate text-2xl font-semibold text-neutral-900">
              {displayLine}
            </p>

            <div className="mx-auto mt-5 max-w-sm space-y-3 text-left">
              <div className="flex items-center gap-2.5 text-sm text-neutral-700">
                <IconMail className="h-4 w-4 shrink-0 text-neutral-500" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-neutral-700">
                <IconPhone className="h-4 w-4 shrink-0 text-neutral-500" />
                <span className="truncate">{phoneDisplay}</span>
              </div>
            </div>

            {isAdmin ? (
              <Link
                href={SITE_ROUTES.admin}
                onClick={onNavigate}
                className="account-admin-badge-neon mt-2 inline-block truncate text-sm font-bold tracking-wide"
              >
                {SITE_HEADER.accountPopoverAdminBadge}
              </Link>
            ) : null}

            <p className="mt-5 border-t border-neutral-200 pt-4 text-sm text-neutral-500">
              {SITE_HEADER.accountPopoverManageSettingsLine}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                className={actionButtonNavyClass}
                onClick={openEdit}
                aria-label={SITE_HEADER.accountPopoverEditProfileCta}
              >
                {SITE_HEADER.accountPopoverEditProfileCta}
              </button>
              <button
                type="button"
                className={actionButtonNavyClass}
                onClick={openPasswordEdit}
                aria-label={SITE_HEADER.accountPopoverUpdatePasswordCta}
              >
                {SITE_HEADER.accountPopoverUpdatePasswordCta}
              </button>
              <Link
                href={SITE_ROUTES.accountOrders}
                className={actionButtonNavyClass}
                onClick={onNavigate}
              >
                {SITE_HEADER.accountPopoverViewOrdersCta}
              </Link>
              <button
                type="button"
                className={actionButtonClass}
                disabled={isPending}
                onClick={handleLogout}
                aria-label={SITE_HEADER.logout}
              >
                {isPending ? "Logging out..." : SITE_HEADER.logout}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
