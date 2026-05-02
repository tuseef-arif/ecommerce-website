"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import {
  clearSessionCookiesAction,
  updateAccountProfileAction,
} from "@/app/(shop)/actions";
import {
  googleLoginBtnClass,
  googleLoginBtnFullWidthClass,
  submitClass,
  submitFullWidthClass,
} from "@/components/store/account-popover-styles";
import type { AccountPopoverUser } from "@/lib/type/account-popover";
import {
  displayNameFromUser,
  initialsFromDisplayName,
} from "@/components/store/account-popover-utils";
import { FormInputField } from "@/components/ui/form-input-field";
import { SITE_HEADER, SITE_ROUTES } from "@/lib/config/site-config";

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
  const [firstName, setFirstName] = useState(user.firstName?.trim() ?? "");
  const [lastName, setLastName] = useState(user.lastName?.trim() ?? "");
  const [phone, setPhone] = useState(user.phone?.trim() ?? "");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const displayLine = displayNameFromUser(user);
  const avatarInitials = initialsFromDisplayName(displayLine);
  const phoneDisplay =
    user.phone?.trim() && user.phone.trim().length > 0
      ? user.phone.trim()
      : SITE_HEADER.accountPopoverPhoneEmpty;

  const openEdit = () => {
    setFirstName(user.firstName?.trim() ?? "");
    setLastName(user.lastName?.trim() ?? "");
    setPhone(user.phone?.trim() ?? "");
    setSaveError(null);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setFirstName(user.firstName?.trim() ?? "");
    setLastName(user.lastName?.trim() ?? "");
    setPhone(user.phone?.trim() ?? "");
    setSaveError(null);
    setIsEditing(false);
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
      router.refresh();
    });
  };

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="flex gap-3 pb-4 pr-12 md:pr-14">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--store-brand-primary)] text-sm font-bold text-white"
          aria-hidden
        >
          {isEditing
            ? initialsFromDisplayName(
                [firstName.trim(), lastName.trim()].filter(Boolean).join(" ") ||
                  displayLine,
              )
            : avatarInitials}
        </div>
        <div className="min-w-0 flex-1">
          {!isEditing ? (
            <>
              <h2
                id={titleId}
                className="truncate text-base font-semibold text-neutral-900 md:text-lg"
              >
                {displayLine}
              </h2>
              <p className="mt-0.5 truncate text-sm text-neutral-500">
                {user.email}
              </p>
              <p className="mt-0.5 truncate text-sm text-neutral-500">
                {phoneDisplay}
              </p>
              {isAdmin ? (
                <Link
                  href={SITE_ROUTES.admin}
                  onClick={onNavigate}
                  className="account-admin-badge-neon mt-1 inline-block truncate text-sm font-bold tracking-wide"
                >
                  {SITE_HEADER.accountPopoverAdminBadge}
                </Link>
              ) : null}
            </>
          ) : (
            <form className="space-y-3" onSubmit={handleProfileSubmit}>
              <h2
                id={titleId}
                className="text-base font-semibold text-neutral-900 md:text-lg"
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

              <div className="flex w-full flex-col gap-3 pt-1">
                <button
                  type="submit"
                  className={submitFullWidthClass}
                  disabled={isPending}
                >
                  {isPending
                    ? "Saving…"
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
          )}
        </div>
      </div>

      {!isEditing ? (
        <div className="flex w-full flex-col items-center gap-3 border-t border-neutral-100 pt-4">
          <button type="button" className={submitClass} onClick={openEdit}>
            {SITE_HEADER.accountPopoverEditProfileCta}
          </button>
          <Link
            href={SITE_ROUTES.accountOrders}
            className={submitClass}
            onClick={onNavigate}
          >
            {SITE_HEADER.accountPopoverViewOrdersCta}
          </Link>
          <button
            type="button"
            className={googleLoginBtnClass}
            disabled={isPending}
            onClick={handleLogout}
          >
            {SITE_HEADER.logout}
          </button>
        </div>
      ) : null}
    </div>
  );
};
