"use client";

import { StoreBrandTextLink } from "@/components/ui/store-brand-text-link";
import { authCrossFooterClass } from "@/components/store/account-popover-styles";
import { SITE_HEADER } from "@/lib/config/site-config";

export const AuthCrossFooterNeedSignup = ({
  onSignup,
}: {
  onSignup: () => void;
}) => (
  <div className={authCrossFooterClass}>
    <p className="text-sm text-neutral-600">
      {SITE_HEADER.accountPopoverNoAccountQuestion}{" "}
      <StoreBrandTextLink type="button" onClick={onSignup}>
        {SITE_HEADER.accountPopoverSignUpLinkCta}
      </StoreBrandTextLink>
    </p>
  </div>
);

export const AuthCrossFooterNeedLogin = ({
  onLogin,
}: {
  onLogin: () => void;
}) => (
  <div className={authCrossFooterClass}>
    <p className="text-sm text-neutral-600">
      {SITE_HEADER.accountPopoverHasAccountQuestion}{" "}
      <StoreBrandTextLink type="button" onClick={onLogin}>
        {SITE_HEADER.accountPopoverLoginLinkCta}
      </StoreBrandTextLink>
    </p>
  </div>
);

export const AuthMethodDividerOr = () => (
  <div className="my-5 flex items-center gap-3" role="presentation">
    <div className="h-px min-h-px flex-1 bg-neutral-200" aria-hidden />
    <span
      className="shrink-0 text-xs font-semibold uppercase tracking-wide text-neutral-500"
      aria-hidden
    >
      {SITE_HEADER.accountPopoverAuthDividerLabel}
    </span>
    <div className="h-px min-h-px flex-1 bg-neutral-200" aria-hidden />
  </div>
);
