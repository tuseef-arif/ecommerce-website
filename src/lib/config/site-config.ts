/**
 * Single source for store branding, contact, routes, nav, and UI copy.
 * Edit `SITE_DEFAULTS` for white-label defaults. `NEXT_PUBLIC_SITE_URL` overrides
 * the canonical site origin in deployed environments (metadata, emails, absolute links).
 */

import { SITE_DEFAULTS } from "./site-config.data";

const resolveSiteUrlFromEnv = (): string | undefined => {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return undefined;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return undefined;
    return `${u.protocol}//${u.host}`;
  } catch {
    return undefined;
  }
};

// --- Identity & contact ---

export const SITE_URL = resolveSiteUrlFromEnv() ?? SITE_DEFAULTS.siteUrl;

export const STORE_BUSINESS_NAME = SITE_DEFAULTS.businessName;

export const SITE_META_DESCRIPTION = SITE_DEFAULTS.metaDescription;

export const STORE_TAGLINE = SITE_DEFAULTS.tagline;

export const STORE_HOURS = SITE_DEFAULTS.hours;

export const STORE_ADDRESS_STREET = SITE_DEFAULTS.addressStreet;

export const STORE_ADDRESS_LOCALITY = SITE_DEFAULTS.addressLocality;

export const STORE_ADDRESS = `${STORE_ADDRESS_STREET}, ${STORE_ADDRESS_LOCALITY}`;

export const STORE_PHONE_DISPLAY = SITE_DEFAULTS.phoneDisplay;

export const STORE_PHONE_TEL = SITE_DEFAULTS.phoneTel;

export const STORE_EMAIL = SITE_DEFAULTS.email;

export const STORE_GOOGLE_MAPS_PLACE_URL = SITE_DEFAULTS.googleMapsPlaceUrl;

export const SITE_OG_LOCALE = SITE_DEFAULTS.ogLocale;

export const STORE_ADDRESS_COUNTRY = SITE_DEFAULTS.addressCountryCode;

export const SITE_AREA_SERVED_CITY = SITE_DEFAULTS.areaServedCity;

export const SITE_AREA_SERVED_COUNTRY = SITE_DEFAULTS.areaServedCountry;

export const SITE_COPYRIGHT_YEAR = SITE_DEFAULTS.copyrightYear;

export const SITE_COPYRIGHT_LINE = `Copyright © ${SITE_COPYRIGHT_YEAR} ${STORE_BUSINESS_NAME}`;

export const SITE_PATH_LOGO = SITE_DEFAULTS.paths.logo;

export const SITE_PATH_PAYMENT_METHODS_SVG =
  SITE_DEFAULTS.paths.paymentMethodsSvg;

export const SITE_PATH_FAVICON = SITE_DEFAULTS.paths.favicon;

export const SITE_ROUTES = SITE_DEFAULTS.routes;

/** In-page anchor on `StoreFooter` for “scroll to contact” links (replaces removed `/contact` route). */
export const STORE_SITE_FOOTER_DOM_ID = "store-site-footer";

export const SITE_LOGIN_PAGE = SITE_DEFAULTS.publicPages.login;

export const SITE_REGISTER_PAGE = SITE_DEFAULTS.publicPages.register;

export const SITE_REGISTER_VERIFY_PAGE =
  SITE_DEFAULTS.publicPages.registerVerifyEmail;

export const SITE_HEADER = SITE_DEFAULTS.header;

export const SITE_FOOTER = SITE_DEFAULTS.footer;

export const SITE_SOCIAL_LABELS = SITE_DEFAULTS.socialLabels;

export const SITE_CATEGORY_SLIDER = SITE_DEFAULTS.categorySlider;

export const SITE_CATEGORY_SLIDES = SITE_DEFAULTS.categorySlides;

export const SITE_HERO_BANNER = SITE_DEFAULTS.heroBanner;

export const SITE_PRODUCT_SLIDER = SITE_DEFAULTS.productSlider;

export const SITE_PRODUCT_DETAIL = SITE_DEFAULTS.productDetail;

export const SITE_PRODUCT_FORM = SITE_DEFAULTS.productForm;

export const SITE_HOME_PRODUCT_RAILS =
  SITE_DEFAULTS.publicPages.home.productRails;

export const SITE_PRODUCTS_LISTING_PAGE =
  SITE_DEFAULTS.publicPages.productsListing;

export const SITE_ARIA_LOGO_HOME = `${STORE_BUSINESS_NAME} home`;

export const SITE_MAP_IFRAME_TITLE = `${STORE_BUSINESS_NAME} on Google Maps`;

// --- Social URLs ---

export const STORE_SOCIAL_INSTAGRAM = SITE_DEFAULTS.social.instagram;

export const STORE_SOCIAL_YOUTUBE = SITE_DEFAULTS.social.youtube;

export const STORE_SOCIAL_WHATSAPP = SITE_DEFAULTS.social.whatsapp;

export const STORE_SOCIAL_TIKTOK = SITE_DEFAULTS.social.tiktok;

// --- Map embed ---

const isSafeMapEmbedUrl = (url: string): boolean => {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    const path = u.pathname.toLowerCase();
    if (host === "maps.google.com") {
      return path === "/maps" || path.startsWith("/maps/");
    }
    if (host === "www.google.com" || host === "google.com") {
      return path === "/maps" || path.startsWith("/maps/");
    }
    return false;
  } catch {
    return false;
  }
};

const rawMapEmbed = SITE_DEFAULTS.googleMapsEmbedUrl.trim();

/**
 * Place name + address in `q` restores the labeled pin and top-left place card in the embed.
 * `ll` keeps the viewport centered on configured coordinates (avoids ambiguous geocoding).
 */
const buildDefaultMapEmbed = (): string => {
  const q = `${STORE_BUSINESS_NAME}, ${STORE_ADDRESS}`;
  return `https://www.google.com/maps?q=${encodeURIComponent(
    q,
  )}&ll=${SITE_DEFAULTS.mapLat}%2C${SITE_DEFAULTS.mapLng}&z=16&hl=en&output=embed`;
};

export const STORE_MAP_EMBED_SRC =
  rawMapEmbed.length > 0 && isSafeMapEmbedUrl(rawMapEmbed)
    ? rawMapEmbed
    : buildDefaultMapEmbed();

/** Full-width shop shell: no max-width cap, responsive horizontal padding only. */
export const STORE_SHELL =
  "w-full min-w-0 px-4 sm:px-5 md:px-6 lg:px-8 xl:px-10";
