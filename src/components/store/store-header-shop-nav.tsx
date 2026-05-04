"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { IconChevronDown, IconChevronRight } from "@/components/icons";
import { MobileNavCategoryIcon } from "@/components/store/mobile-nav-icons";
import {
  NAV_BAR_MORE_BUTTON_LABEL,
  STORE_NAV_BAR_DROPDOWNS,
  STORE_NAV_BAR_MORE_ITEMS,
} from "@/lib/config/nav-bar-data";
import { SITE_HEADER } from "@/lib/config/site-config";
import {
  DESKTOP_NAV_DROPDOWN_STAGGER_STEP_MS,
  DESKTOP_SHOP_NAV_HOVER_CLOSE_DELAY_MS,
} from "@/lib/constants/ui-timeouts";

const desktopTriggerBase =
  "inline-flex items-center rounded-md px-1 py-0.5 text-sm font-medium transition-colors duration-200 lg:text-base";
const desktopTriggerFocus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

const staggerStyle = (
  index: number,
  baseMs = DESKTOP_NAV_DROPDOWN_STAGGER_STEP_MS,
): CSSProperties =>
  ({
    "--store-header-dropdown-stagger": `${index * baseMs}ms`,
  }) as CSSProperties;

type DesktopShopNavProps = {
  navRef: RefObject<HTMLDivElement | null>;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  toggleMenu: (id: string) => void;
  closeMenu: () => void;
};

/**
 * Desktop shop menus: hover open/close on fine-pointer devices; tap toggles everywhere.
 * Dropdown surface matches the mobile drawer (glass + sky tone on brand bar).
 */
export const StoreHeaderDesktopShopNav = ({
  navRef,
  openMenuId,
  setOpenMenuId,
  toggleMenu,
  closeMenu,
}: DesktopShopNavProps) => {
  const [hoverMenus, setHoverMenus] = useState(false);
  const hoverLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setHoverMenus(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(
    () => () => {
      if (hoverLeaveTimerRef.current !== null) {
        clearTimeout(hoverLeaveTimerRef.current);
      }
    },
    [],
  );

  const cancelHoverMenuClose = () => {
    if (hoverLeaveTimerRef.current !== null) {
      clearTimeout(hoverLeaveTimerRef.current);
      hoverLeaveTimerRef.current = null;
    }
  };

  const scheduleHoverMenuClose = () => {
    cancelHoverMenuClose();
    hoverLeaveTimerRef.current = setTimeout(() => {
      hoverLeaveTimerRef.current = null;
      setOpenMenuId(null);
    }, DESKTOP_SHOP_NAV_HOVER_CLOSE_DELAY_MS);
  };

  const desktopShopTriggerClass = (isOpen: boolean) =>
    [
      desktopTriggerBase,
      desktopTriggerFocus,
      isOpen ? "text-white" : "text-white/90 hover:text-white",
      isOpen ? "underline decoration-2 underline-offset-4" : "",
    ].join(" ");

  const renderPanel = (
    id: string,
    triggerId: string,
    children: ReactNode,
    alignClass = "left-0",
  ) => (
    <div
      id={`desktop-shop-panel-${id}`}
      role="region"
      aria-labelledby={triggerId}
      className={`store-header__dropdown-panel store-header__dropdown-panel--scroll absolute ${alignClass} top-full z-[55] min-w-[13.75rem] max-w-[min(20rem,calc(100vw-2rem))] py-1`}
    >
      {children}
    </div>
  );

  return (
    <nav
      ref={navRef}
      className="hidden shrink-0 items-center gap-2 text-sm font-medium md:flex lg:gap-4 lg:text-base"
      aria-label={SITE_HEADER.shopNavAriaLabel}
    >
      {STORE_NAV_BAR_DROPDOWNS.map((group) => {
        const isOpen = openMenuId === group.id;
        const triggerId = `desktop-shop-trigger-${group.id}`;
        return (
          <div
            key={group.id}
            className={`relative ${isOpen ? "pb-3" : ""}`}
            onMouseEnter={() => {
              if (!hoverMenus) return;
              cancelHoverMenuClose();
              setOpenMenuId(group.id);
            }}
            onMouseLeave={() => {
              if (hoverMenus) scheduleHoverMenuClose();
            }}
          >
            <button
              type="button"
              className={desktopShopTriggerClass(isOpen)}
              aria-expanded={isOpen}
              aria-haspopup="true"
              aria-controls={`desktop-shop-panel-${group.id}`}
              id={triggerId}
              onClick={() => toggleMenu(group.id)}
            >
              {group.label}
            </button>
            {isOpen
              ? renderPanel(
                  group.id,
                  triggerId,
                  <ul className="store-header__dropdown-panel__scroll-list list-none px-1 py-1">
                    <li
                      className="store-header__dropdown-item"
                      style={staggerStyle(0)}
                    >
                      <Link
                        href={group.categoryHref}
                        className="store-header__dropdown-view-all rounded-md"
                        onClick={closeMenu}
                      >
                        {SITE_HEADER.navViewAllInCategory}{" "}
                        <span className="store-header__dropdown-view-all-muted">
                          — {group.label}
                        </span>
                      </Link>
                    </li>
                    {group.children.map((item, idx) => (
                      <li
                        key={`${group.id}-${item.id}`}
                        className="store-header__dropdown-item"
                        style={staggerStyle(idx + 1)}
                      >
                        <Link
                          href={item.href}
                          className="store-header__dropdown-link"
                          onClick={closeMenu}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>,
                )
              : null}
          </div>
        );
      })}
      <div
        className={`relative ${openMenuId === "more" ? "pb-3" : ""}`}
        onMouseEnter={() => {
          if (!hoverMenus) return;
          cancelHoverMenuClose();
          setOpenMenuId("more");
        }}
        onMouseLeave={() => {
          if (hoverMenus) scheduleHoverMenuClose();
        }}
      >
        <button
          type="button"
          className={desktopShopTriggerClass(openMenuId === "more")}
          aria-expanded={openMenuId === "more"}
          aria-haspopup="true"
          aria-controls="desktop-shop-panel-more"
          id="desktop-shop-trigger-more"
          onClick={() => toggleMenu("more")}
        >
          {NAV_BAR_MORE_BUTTON_LABEL}
        </button>
        {openMenuId === "more"
          ? renderPanel(
              "more",
              "desktop-shop-trigger-more",
              <ul className="store-header__dropdown-panel__scroll-list list-none px-1 py-1">
                {STORE_NAV_BAR_MORE_ITEMS.map((item, idx) => (
                  <li
                    key={item.id}
                    className="store-header__dropdown-item"
                    style={staggerStyle(idx)}
                  >
                    <Link
                      href={item.href}
                      className="store-header__dropdown-link"
                      onClick={closeMenu}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>,
            )
          : null}
      </div>
    </nav>
  );
};

type MobileShopNavProps = {
  mobileShopExpandedId: string | null;
  toggleMobileShopSection: (id: string) => void;
  closeDrawer: () => void;
};

const mobileChevronClass =
  "h-5 w-5 shrink-0 text-neutral-400 transition-transform duration-200 ease-out";

const mobileRowButtonClass =
  "flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-4 text-left transition-colors hover:bg-neutral-50";

const mobileRowLinkClass =
  "flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-4 text-left transition-colors hover:bg-neutral-50";

/**
 * Mobile drawer category list — same `STORE_NAV_BAR_*` data as desktop; Priceoye-style rows (icon + label + chevron).
 */
export const StoreHeaderMobileShopNav = ({
  mobileShopExpandedId,
  toggleMobileShopSection,
  closeDrawer,
}: MobileShopNavProps) => (
  <div className="flex flex-col pb-1">
    <p className="px-4 pb-2 pt-1 text-sm font-semibold uppercase tracking-[0.12em] text-neutral-400">
      {SITE_HEADER.mobileNavCategoriesLabel}
    </p>

    <div>
      {STORE_NAV_BAR_DROPDOWNS.map((group) => {
        const expanded = mobileShopExpandedId === group.id;
        return (
          <div key={group.id} className="flex flex-col">
            <button
              type="button"
              className={`${mobileRowButtonClass} ${expanded ? "bg-neutral-50/90" : ""}`}
              aria-expanded={expanded}
              onClick={() => toggleMobileShopSection(group.id)}
            >
              <MobileNavCategoryIcon id={group.id} />
              <span className="min-w-0 flex-1 text-lg font-medium text-neutral-800">
                {group.label}
              </span>
              <IconChevronDown
                className={`${mobileChevronClass} ${expanded ? "rotate-180" : ""}`}
              />
            </button>
            {expanded ? (
              <ul className="max-h-[min(58vh,calc(100dvh-13rem))] list-none overflow-y-auto overscroll-y-contain border-b border-neutral-100 bg-neutral-50/70 py-1.5 pl-[3.25rem] pr-2 pb-3">
                <li
                  className="store-header__mobile-dropdown-item"
                  style={staggerStyle(0)}
                >
                  <Link
                    href={group.categoryHref}
                    className="block rounded-md py-2.5 text-base font-semibold text-[var(--store-brand-primary)]"
                    onClick={closeDrawer}
                  >
                    {SITE_HEADER.navViewAllInCategory}
                  </Link>
                </li>
                {group.children.map((item, idx) => (
                  <li
                    key={`${group.id}-${item.id}`}
                    className="store-header__mobile-dropdown-item"
                    style={staggerStyle(idx + 1)}
                  >
                    <Link
                      href={item.href}
                      className="block rounded-md py-2.5 text-base text-neutral-700 hover:text-neutral-950"
                      onClick={closeDrawer}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}

      {STORE_NAV_BAR_MORE_ITEMS.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={mobileRowLinkClass}
          onClick={closeDrawer}
        >
          <MobileNavCategoryIcon id={item.id} />
          <span className="min-w-0 flex-1 text-lg font-medium text-neutral-800">
            {item.label}
          </span>
          <IconChevronRight className="h-5 w-5 shrink-0 text-neutral-300" />
        </Link>
      ))}
    </div>
  </div>
);
