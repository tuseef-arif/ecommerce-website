"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  clearSessionCookiesAction,
  updateAccountProfileAction,
  updateAccountPasswordAction,
  uploadAccountProfileImageAction,
  type UploadAccountProfileImageResult,
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
import { PROFILE_IMAGE_MAX_BYTES } from "@/lib/validate-profile-image";
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
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const imageUploadLockRef = useRef(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
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
  const [isImageUploadPending, startImageUploadTransition] = useTransition();

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
  /** First grid row: keep two-word labels on one line in narrow popovers. */
  const actionButtonNavyProfileRowClass = `${actionButtonNavyClass} whitespace-nowrap px-2 py-2 text-[0.8125rem] leading-tight sm:px-3 sm:text-sm`;

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
    setImageUploadError(null);
    setIsPasswordEditing(false);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setFirstName(user.firstName?.trim() ?? "");
    setLastName(user.lastName?.trim() ?? "");
    setPhone(user.phone?.trim() ?? "");
    setSaveError(null);
    setImageUploadError(null);
    setIsEditing(false);
  };

  const openPasswordEdit = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setSaveError(null);
    setImageUploadError(null);
    setIsEditing(false);
    setIsPasswordEditing(true);
  };

  const cancelPasswordEdit = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setSaveError(null);
    setImageUploadError(null);
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

  const handleProfileImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) {
      input.value = "";
      return;
    }

    if (imageUploadLockRef.current) {
      input.value = "";
      return;
    }

    if (file.size > PROFILE_IMAGE_MAX_BYTES) {
      setImageUploadError(SITE_HEADER.accountPopoverProfileImageTooLarge);
      input.value = "";
      return;
    }

    input.value = "";
    setImageUploadError(null);
    imageUploadLockRef.current = true;

    startImageUploadTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("profileImage", file);
        let result: UploadAccountProfileImageResult;
        try {
          result = await uploadAccountProfileImageAction(fd);
        } catch {
          setImageUploadError(
            SITE_HEADER.accountPopoverProfileImageUploadNetworkError,
          );
          return;
        }
        if (!result.ok) {
          setImageUploadError(result.error);
          return;
        }
        setShowDetailsUpdatedFlash(true);
        queueMicrotask(() => {
          router.refresh();
        });
      } finally {
        imageUploadLockRef.current = false;
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

            {imageUploadError ? (
              <p
                className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700"
                role="alert"
              >
                {imageUploadError}
              </p>
            ) : null}

            <div className="relative mx-auto h-28 w-28 shrink-0">
              <input
                ref={profileImageInputRef}
                type="file"
                name="profileImage"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                tabIndex={-1}
                disabled={isImageUploadPending}
                onChange={handleProfileImageChange}
              />
              {user.profileImagePath ? (
                <Image
                  key={user.profileImagePath}
                  src={user.profileImagePath}
                  alt={`${displayLine} profile photo`}
                  width={112}
                  height={112}
                  className="h-full w-full rounded-full object-cover ring-2 ring-white shadow-sm"
                  unoptimized
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center rounded-full bg-[var(--store-brand-primary)] text-2xl font-bold text-white ring-2 ring-white shadow-sm"
                  aria-hidden
                >
                  {avatarInitials}
                </div>
              )}
              <button
                type="button"
                className="absolute -bottom-0.5 -right-0.5 flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-md transition-colors hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPending || isImageUploadPending}
                aria-label={SITE_HEADER.accountPopoverChangeProfilePhotoAria}
                onClick={() => profileImageInputRef.current?.click()}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-2h4l2 2h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="3.5" />
                </svg>
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <p className="min-w-0 max-w-full truncate text-2xl font-semibold text-neutral-900">
                {displayLine}
              </p>
            </div>

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

            <p className="mt-5 border-t border-neutral-200 pt-4 text-sm text-neutral-500">
              {SITE_HEADER.accountPopoverManageSettingsLine}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                className={actionButtonNavyProfileRowClass}
                onClick={openEdit}
                aria-label={SITE_HEADER.accountPopoverEditProfileCta}
              >
                {SITE_HEADER.accountPopoverEditProfileCta}
              </button>
              <button
                type="button"
                className={actionButtonNavyProfileRowClass}
                onClick={openPasswordEdit}
                aria-label={SITE_HEADER.accountPopoverUpdatePasswordCta}
              >
                {SITE_HEADER.accountPopoverUpdatePasswordCta}
              </button>
              <Link
                href={
                  isAdmin ? SITE_ROUTES.dashboard : SITE_ROUTES.accountOrders
                }
                className={actionButtonNavyClass}
                onClick={onNavigate}
                aria-label={
                  isAdmin
                    ? SITE_HEADER.accountPopoverViewDashboardCta
                    : SITE_HEADER.accountPopoverViewOrdersCta
                }
              >
                {isAdmin
                  ? SITE_HEADER.accountPopoverViewDashboardCta
                  : SITE_HEADER.accountPopoverViewOrdersCta}
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
