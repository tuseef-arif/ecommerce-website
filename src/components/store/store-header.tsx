"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { UserRole } from "@/generated/prisma/enums";
import { clearSessionCookiesAction } from "@/app/(shop)/actions";
import { IconAccount, IconCart, IconSearch } from "@/components/icons";
import {
  ACCOUNT_POPOVER_ELEMENT_ID,
  AccountPopover,
  STORE_AUTH_SUCCESS_ELEMENT_ID,
} from "@/components/store/account-popover";
import { StoreAuthSuccessDialog } from "@/components/store/store-auth-success-dialog";
import {
  StoreDrawerCloseButton,
  StoreDrawerGuestAuthButtons,
} from "@/components/store/store-drawer-chrome";
import {
  StoreHeaderDesktopShopNav,
  StoreHeaderMobileShopNav,
} from "@/components/store/store-header-shop-nav";
import { mobileSignedInGreetingFromUser } from "@/components/store/account-popover-utils";
import type { AccountPopoverUser, GuestView } from "@/lib/type/account-popover";
import {
  SITE_ARIA_LOGO_HOME,
  SITE_HEADER,
  SITE_PATH_LOGO,
  SITE_ROUTES,
  STORE_BUSINESS_NAME,
  STORE_SHELL,
} from "@/lib/config/site-config";

const headerIconBtnClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

const mobileToolbarIconClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

type StoreHeaderProps = {
  user: AccountPopoverUser | null;
  /** Cart line-item count; shown on mobile cart badge. Wire when cart state exists. */
  cartItemCount?: number;
};

type HeaderSearchFormProps = {
  inputId: string;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  /** e.g. `min-w-0 flex-1` when the form sits in the desktop header row */
  className?: string;
};

const HeaderSearchForm = ({
  inputId,
  onSubmit,
  className = "",
}: HeaderSearchFormProps) => (
  <form
    role="search"
    className={`flex w-full min-w-0 max-w-full overflow-hidden rounded-full border border-white/40 bg-white shadow-sm ${className}`.trim()}
    onSubmit={onSubmit}
  >
    <label htmlFor={inputId} className="sr-only">
      {SITE_HEADER.searchFieldSrLabel}
    </label>
    <input
      id={inputId}
      name="q"
      type="search"
      placeholder={SITE_HEADER.searchPlaceholder}
      autoComplete="off"
      className="min-w-0 flex-1 border-0 bg-transparent py-2.5 pl-4 pr-2 text-sm text-neutral-900 placeholder:text-neutral-500 outline-none ring-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0"
    />
    <button
      type="submit"
      className="flex w-11 shrink-0 items-center justify-center bg-[var(--store-brand-primary)] text-white transition-colors hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white"
      aria-label={SITE_HEADER.searchSubmitAria}
    >
      <IconSearch className="h-5 w-5" />
    </button>
  </form>
);

export const StoreHeader = ({ user, cartItemCount = 0 }: StoreHeaderProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDesktopShopMenuId, setOpenDesktopShopMenuId] = useState<
    string | null
  >(null);
  const [mobileShopExpandedId, setMobileShopExpandedId] = useState<
    string | null
  >(null);
  const [accountPopoverOpen, setAccountPopoverOpen] = useState(false);
  const [mobileLogoutSuccessOpen, setMobileLogoutSuccessOpen] = useState(false);
  const [routeAuthSuccessKind, setRouteAuthSuccessKind] = useState<
    "login" | "register" | null
  >(null);
  const [loginNoticeMessage, setLoginNoticeMessage] = useState<string | null>(
    null,
  );
  const [signupUrlError, setSignupUrlError] = useState<string | null>(null);
  const [initialGuestView, setInitialGuestView] = useState<GuestView>("login");
  const [resetPasswordToken, setResetPasswordToken] = useState<string | null>(
    null,
  );
  const [resetPasswordUrlError, setResetPasswordUrlError] = useState<
    string | null
  >(null);
  const [isMobileLogoutPending, startMobileLogoutTransition] = useTransition();
  const [accountPopoverTriggerOrigin, setAccountPopoverTriggerOrigin] =
    useState<"mobile" | "desktop">("desktop");
  const accountMobileWrapRef = useRef<HTMLDivElement>(null);
  const accountDesktopWrapRef = useRef<HTMLDivElement>(null);
  const accountMobileTriggerRef = useRef<HTMLButtonElement>(null);
  const accountDesktopTriggerRef = useRef<HTMLButtonElement>(null);
  const desktopShopNavRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  const closeAccountPopover = useCallback(() => {
    setAccountPopoverOpen(false);
    setLoginNoticeMessage(null);
    setSignupUrlError(null);
    setInitialGuestView("login");
    setResetPasswordToken(null);
    setResetPasswordUrlError(null);
  }, []);

  const finalizeMobileLogoutSuccess = useCallback(() => {
    setMobileLogoutSuccessOpen(false);
    router.refresh();
  }, [router]);

  const handleAccountPopoverLogoutSuccess = useCallback(() => {
    setAccountPopoverOpen(false);
    setMobileLogoutSuccessOpen(true);
  }, []);

  const finalizeRouteAuthSuccess = useCallback(() => {
    setRouteAuthSuccessKind(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("authSuccess");
    const nextUrl =
      params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
    router.refresh();
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isMenuOpen, closeMenu]);

  useEffect(() => {
    const authSuccess = searchParams.get("authSuccess");
    if (authSuccess === "login" || authSuccess === "register") {
      startTransition(() => {
        setRouteAuthSuccessKind(authSuccess);
      });
    }
  }, [searchParams]);

  useEffect(() => {
    const authView = searchParams.get("authView");
    if (authView === "login") {
      const authNotice = searchParams.get("authNotice");
      startTransition(() => {
        setInitialGuestView("login");
        setSignupUrlError(null);
        if (!user && authNotice === "password_reset_success") {
          setLoginNoticeMessage(
            "Password updated successfully. You can login.",
          );
        } else {
          setLoginNoticeMessage(null);
        }
        setResetPasswordToken(null);
        setResetPasswordUrlError(null);
        setAccountPopoverTriggerOrigin("desktop");
        setAccountPopoverOpen(true);
      });

      const params = new URLSearchParams(searchParams.toString());
      params.delete("authView");
      params.delete("authNotice");
      const nextUrl =
        params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
      router.replace(nextUrl, { scroll: false });
      return;
    }

    if (authView === "signup") {
      startTransition(() => {
        setInitialGuestView("signup");
        setLoginNoticeMessage(null);
        setSignupUrlError(searchParams.get("error")?.trim() || null);
        setResetPasswordToken(null);
        setResetPasswordUrlError(null);
        setAccountPopoverTriggerOrigin("desktop");
        setAccountPopoverOpen(true);
      });

      const params = new URLSearchParams(searchParams.toString());
      params.delete("authView");
      params.delete("error");
      const nextUrl =
        params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
      router.replace(nextUrl, { scroll: false });
      return;
    }

    if (authView === "reset-password") {
      const tokenFromUrl = searchParams.get("token")?.trim() || null;
      startTransition(() => {
        setInitialGuestView(tokenFromUrl ? "reset" : "forgot");
        setLoginNoticeMessage(null);
        setSignupUrlError(null);
        if (!user) {
          setResetPasswordToken(tokenFromUrl);
          setResetPasswordUrlError(searchParams.get("error")?.trim() || null);
        } else {
          setResetPasswordToken(null);
          setResetPasswordUrlError(null);
        }
        setAccountPopoverTriggerOrigin("desktop");
        setAccountPopoverOpen(true);
      });

      const params = new URLSearchParams(searchParams.toString());
      params.delete("authView");
      params.delete("token");
      params.delete("error");
      const nextUrl =
        params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
      router.replace(nextUrl, { scroll: false });
    }
  }, [pathname, router, searchParams, user]);

  /** Route changes only — do not depend on `user`. After profile/password update,
   * `router.refresh()` updates `user` and must not close the account dialog. */
  useEffect(() => {
    startTransition(() => {
      const shouldKeepAuthPopoverOpen =
        typeof window !== "undefined" &&
        ["login", "signup", "reset-password"].includes(
          new URLSearchParams(window.location.search).get("authView") ?? "",
        );
      if (!shouldKeepAuthPopoverOpen) {
        setAccountPopoverOpen(false);
      }
      setIsMenuOpen(false);
      setOpenDesktopShopMenuId(null);
      setMobileShopExpandedId(null);
    });
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;
    startTransition(() => {
      setAccountPopoverOpen(false);
    });
  }, [isMenuOpen]);

  useEffect(() => {
    if (!accountPopoverOpen) return undefined;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (
        typeof document !== "undefined" &&
        document.getElementById(STORE_AUTH_SUCCESS_ELEMENT_ID)
      ) {
        return;
      }
      setAccountPopoverOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      const inMobile = accountMobileWrapRef.current?.contains(t);
      const inDesktop = accountDesktopWrapRef.current?.contains(t);
      const inAccountDialog =
        typeof document !== "undefined" &&
        document.getElementById(ACCOUNT_POPOVER_ELEMENT_ID)?.contains(t);
      const inAuthSuccessSheet =
        typeof document !== "undefined" &&
        document.getElementById(STORE_AUTH_SUCCESS_ELEMENT_ID)?.contains(t);
      if (!inMobile && !inDesktop && !inAccountDialog && !inAuthSuccessSheet)
        setAccountPopoverOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [accountPopoverOpen]);

  useEffect(() => {
    if (!openDesktopShopMenuId) return undefined;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenDesktopShopMenuId(null);
    };
    document.addEventListener("keydown", onKeyDown);

    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (desktopShopNavRef.current?.contains(t)) return;
      setOpenDesktopShopMenuId(null);
    };
    document.addEventListener("pointerdown", onPointerDown, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [openDesktopShopMenuId]);

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const isAdmin = user?.role === UserRole.ADMIN;

  const closeDesktopShopMenu = useCallback(() => {
    setOpenDesktopShopMenuId(null);
  }, []);

  const toggleDesktopShopMenu = useCallback((id: string) => {
    setOpenDesktopShopMenuId((current) => (current === id ? null : id));
  }, []);

  const toggleMobileShopSection = useCallback((id: string) => {
    setMobileShopExpandedId((current) => (current === id ? null : id));
  }, []);

  const cartBadgeText =
    cartItemCount > 99 ? "99+" : String(Math.max(0, cartItemCount));

  const accountAria = user
    ? SITE_HEADER.accountAriaSignedIn
    : SITE_HEADER.accountMenuButtonSignedOutAria;

  return (
    <>
      <header className="store-header sticky top-0 z-50 shadow-sm">
        <div className={`relative py-2 md:py-2 ${STORE_SHELL}`}>
          {/* Mobile: row 1 = menu | logo | account+cart; row 2 = search */}
          <div className="flex flex-col gap-2.5 md:hidden">
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
              <button
                type="button"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                aria-expanded={isMenuOpen}
                aria-controls="mobile-nav"
                aria-label={SITE_HEADER.menuButtonOpenAria}
                onClick={() => setIsMenuOpen((o) => !o)}
              >
                <span className="sr-only">{SITE_HEADER.menuToggleSrOnly}</span>
                <span className="flex w-5 flex-col gap-1" aria-hidden>
                  <span className="h-0.5 w-full rounded-full bg-white" />
                  <span className="h-0.5 w-4 self-center rounded-full bg-white" />
                  <span className="h-0.5 w-full rounded-full bg-white" />
                </span>
              </button>

              <div className="flex min-w-0 justify-center px-1">
                <Link
                  href={SITE_ROUTES.home}
                  className="relative flex h-10 max-h-10 min-w-0 items-center justify-center"
                  aria-label={SITE_ARIA_LOGO_HOME}
                >
                  <Image
                    src={SITE_PATH_LOGO}
                    alt=""
                    width={800}
                    height={120}
                    sizes="(max-width: 768px) 42vw, 380px"
                    unoptimized
                    className="block h-full w-auto max-w-[min(11rem,calc(100vw-8.5rem))] object-contain"
                    priority
                  />
                </Link>
              </div>

              <div className="flex shrink-0 items-center justify-end gap-0.5">
                <div ref={accountMobileWrapRef} className="relative">
                  <button
                    ref={accountMobileTriggerRef}
                    type="button"
                    className={mobileToolbarIconClass}
                    aria-expanded={accountPopoverOpen}
                    aria-haspopup="dialog"
                    aria-controls={ACCOUNT_POPOVER_ELEMENT_ID}
                    aria-label={accountAria}
                    onClick={() => {
                      setAccountPopoverTriggerOrigin("mobile");
                      setAccountPopoverOpen((o) => !o);
                    }}
                  >
                    <IconAccount />
                  </button>
                </div>
                <Link
                  href={SITE_ROUTES.cart}
                  className={
                    cartItemCount > 0
                      ? `${mobileToolbarIconClass} relative`
                      : mobileToolbarIconClass
                  }
                  aria-label={SITE_HEADER.cartAria}
                >
                  <IconCart />
                  {cartItemCount > 0 ? (
                    <span
                      className="absolute -right-0.5 -top-1 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-rose-600 px-0.5 text-[0.625rem] font-bold leading-none text-white shadow-sm ring-2 ring-[var(--store-header-gradient-via)]"
                      aria-hidden
                    >
                      {cartBadgeText}
                    </span>
                  ) : null}
                </Link>
              </div>
            </div>

            <HeaderSearchForm
              inputId="store-search-mobile"
              onSubmit={handleSearchSubmit}
            />
          </div>

          {/* Desktop */}
          <div className="hidden min-h-0 min-w-0 items-center gap-2 sm:gap-2.5 md:flex md:gap-4 lg:gap-6">
            <Link
              href={SITE_ROUTES.home}
              className="relative flex h-[2.625rem] min-w-0 shrink items-center sm:h-12 md:h-[3.2rem] md:shrink-0 lg:h-[3.55rem] xl:h-[3.75rem]"
              aria-label={SITE_ARIA_LOGO_HOME}
            >
              <Image
                src={SITE_PATH_LOGO}
                alt=""
                width={800}
                height={120}
                sizes="(max-width: 1024px) 380px, 520px"
                unoptimized
                className="block h-full w-auto max-w-[min(30rem,46vw)] object-contain object-left md:max-w-[min(30rem,46vw)] lg:max-w-none"
                priority
              />
            </Link>

            <StoreHeaderDesktopShopNav
              navRef={desktopShopNavRef}
              openMenuId={openDesktopShopMenuId}
              setOpenMenuId={setOpenDesktopShopMenuId}
              toggleMenu={toggleDesktopShopMenu}
              closeMenu={closeDesktopShopMenu}
            />

            <HeaderSearchForm
              inputId="store-search-desktop"
              onSubmit={handleSearchSubmit}
              className="min-w-0 flex-1"
            />

            <div className="flex shrink-0 items-center gap-1 md:gap-2">
              <div ref={accountDesktopWrapRef} className="relative">
                <button
                  ref={accountDesktopTriggerRef}
                  type="button"
                  className={headerIconBtnClass}
                  aria-expanded={accountPopoverOpen}
                  aria-haspopup="dialog"
                  aria-controls={ACCOUNT_POPOVER_ELEMENT_ID}
                  aria-label={accountAria}
                  onClick={() => {
                    setAccountPopoverTriggerOrigin("desktop");
                    setAccountPopoverOpen((o) => !o);
                  }}
                >
                  <IconAccount />
                </button>
              </div>
              <Link
                href={SITE_ROUTES.cart}
                className={headerIconBtnClass}
                aria-label={SITE_HEADER.cartAria}
              >
                <IconCart />
              </Link>
            </div>
          </div>

          {accountPopoverOpen ? (
            <AccountPopover
              isOpen
              isLoggedIn={!!user}
              user={user}
              isAdmin={isAdmin}
              initialGuestView={initialGuestView}
              loginNoticeMessage={loginNoticeMessage}
              signupUrlError={signupUrlError}
              resetPasswordToken={resetPasswordToken}
              resetPasswordUrlError={resetPasswordUrlError}
              onLogoutSuccess={handleAccountPopoverLogoutSuccess}
              onClose={closeAccountPopover}
              onNavigate={closeAccountPopover}
              triggerRef={
                accountPopoverTriggerOrigin === "mobile"
                  ? accountMobileTriggerRef
                  : accountDesktopTriggerRef
              }
            />
          ) : null}

          {isMenuOpen ? (
            <div className="fixed inset-0 z-[100] md:hidden">
              <button
                type="button"
                className="absolute inset-0 bg-black/45"
                aria-label={SITE_HEADER.menuBackdropCloseAria}
                onClick={closeMenu}
              />
              <aside
                id="mobile-nav"
                className="absolute left-0 top-0 flex h-[100dvh] min-h-0 w-[min(21rem,88vw)] max-w-[85vw] flex-col bg-white shadow-2xl"
                role="dialog"
                aria-modal="true"
                aria-label={SITE_HEADER.mobileNavDialogAria}
              >
                <div className="store-header relative flex min-h-[var(--store-mobile-drawer-header-min-h)] shrink-0 flex-col justify-start px-3 py-2 sm:px-4">
                  <StoreDrawerCloseButton onClick={closeMenu} />

                  <div className="min-w-0 pr-11">
                    <Link
                      href={SITE_ROUTES.home}
                      className="block text-base font-bold leading-tight text-white hover:text-white/95"
                      aria-label={SITE_ARIA_LOGO_HOME}
                      onClick={closeMenu}
                    >
                      {STORE_BUSINESS_NAME}
                    </Link>
                    {user ? (
                      <p className="mt-1 truncate text-lg font-medium leading-snug text-white/90">
                        {mobileSignedInGreetingFromUser(user)}
                      </p>
                    ) : (
                      <>
                        <p className="mt-1 text-[0.8125rem] leading-snug text-white/88">
                          {SITE_HEADER.mobileNavGuestIntro}
                        </p>
                        <StoreDrawerGuestAuthButtons
                          onAfterNavigate={() => {
                            closeMenu();
                            closeAccountPopover();
                          }}
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
                  <nav
                    className="flex flex-col"
                    aria-label={SITE_HEADER.mobileNavSecondaryAria}
                  >
                    <StoreHeaderMobileShopNav
                      mobileShopExpandedId={mobileShopExpandedId}
                      toggleMobileShopSection={toggleMobileShopSection}
                      closeDrawer={closeMenu}
                    />
                  </nav>
                </div>

                {user ? (
                  <div className="shrink-0 border-t border-neutral-100 bg-neutral-50/80 px-4 py-4">
                    <div className="flex flex-col gap-2">
                      {isAdmin ? (
                        <Link
                          href={SITE_ROUTES.dashboard}
                          className="rounded-lg px-3 py-2.5 text-center text-sm font-medium text-neutral-800 ring-1 ring-neutral-200 hover:bg-white"
                          onClick={closeMenu}
                        >
                          {SITE_HEADER.admin}
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        disabled={isMobileLogoutPending}
                        className="w-full rounded-lg bg-[var(--store-brand-primary)] px-3 py-2.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-60"
                        onClick={() => {
                          startMobileLogoutTransition(async () => {
                            const result = await clearSessionCookiesAction();
                            if (result.ok) {
                              closeMenu();
                              setMobileLogoutSuccessOpen(true);
                            }
                          });
                        }}
                      >
                        {SITE_HEADER.logout}
                      </button>
                    </div>
                  </div>
                ) : null}
              </aside>
            </div>
          ) : null}
        </div>
      </header>
      <StoreAuthSuccessDialog
        isOpen={mobileLogoutSuccessOpen}
        onDismiss={finalizeMobileLogoutSuccess}
        title={SITE_HEADER.accountLogoutSuccessTitle}
        message={SITE_HEADER.accountLogoutSuccessMessage}
        titleAccent="wave"
      />
      <StoreAuthSuccessDialog
        isOpen={routeAuthSuccessKind !== null}
        onDismiss={finalizeRouteAuthSuccess}
        message={
          routeAuthSuccessKind === "register"
            ? SITE_HEADER.accountAuthSuccessMessageAfterRegister
            : SITE_HEADER.accountAuthSuccessMessage
        }
      />
    </>
  );
};
