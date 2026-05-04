/**
 * Single source for store branding, contact, routes, nav, and UI copy.
 * Edit `SITE_DEFAULTS` only — nothing here reads from `.env`.
 *
 * **White-label:** change `SITE_DEFAULTS` (including `publicPages`, `routes`,
 * `header`, `footer`, etc.) for a new client; avoid one-off marketing strings in
 * route components — import from this module instead.
 */

/** Non-secret site data — edit here */
const SITE_DEFAULTS = {
  /** Canonical origin for metadata + JSON-LD (protocol, no trailing slash) */
  siteUrl: "http://localhost:3000",
  businessName: "Five Star Mobile",
  metaDescription:
    "Five Star Mobile — one of the best mobile stores in Lahore. Shop our online mobile store in Lahore: buy mobiles in Lahore with genuine devices, clear pricing, and reliable service.",
  tagline:
    "Premium mobiles and accessories in Lahore — genuine devices, clear pricing, reliable service.",
  hours: "Available: 12PM–9PM",
  addressStreet: "Shop no 2, royal arcade",
  addressLocality: "Lahore",
  phoneDisplay: "0321 4385252",
  phoneTel: "tel:+923214385252",
  email: "fivestarmobile.email@gmail.com",
  googleMapsPlaceUrl:
    "https://www.google.com/maps/place/Five+Star+Mobile/@31.4605083,74.0445709,11z/data=!4m10!1m2!2m1!1sfive+star+mobile+shop!3m6!1s0x3919075ace80663f:0x22bfbd9cecf4f026!8m2!3d31.4605083!4d74.3494415!15sChVmaXZlIHN0YXIgbW9iaWxlIHNob3BaFyIVZml2ZSBzdGFyIG1vYmlsZSBzaG9wkgEQY2VsbF9waG9uZV9zdG9yZZoBI0NoWkRTVWhOTUc5blMwVkpRMEZuU1VSNGIyTlBXRU4zRUFF4AEA-gEECAAQRw!16s%2Fg%2F11h59t1y6c?entry=ttu&g_ep=EgoyMDI2MDQyOS4wIKXMDSoASAFQAw%3D%3D",
  /** Optional full iframe `src` from Google Maps embed; leave empty to build from name + address + mapLat/mapLng */
  googleMapsEmbedUrl: "",
  mapLat: "31.4605083",
  mapLng: "74.3494415",
  copyrightYear: 2026,
  ogLocale: "en_PK",
  addressCountryCode: "PK",
  areaServedCity: "Lahore",
  areaServedCountry: "Pakistan",
  paths: {
    logo: "/logos/fsm-logo-clean.png",
    paymentMethodsSvg: "/assets/payment_method.svg",
    favicon: "/logos/favicon.ico",
  },
  routes: {
    home: "/",
    login: "/login",
    register: "/register",
    registerVerifyEmail: "/register/verify-email",
    resetPassword: "/reset-password",
    cart: "/cart",
    contact: "/contact",
    admin: "/admin",
    /** Staff dashboard (route implemented separately) */
    dashboard: "/dashboard",
    accountOrders: "/account/orders",
  },
  /**
   * Public marketing/auth pages — edit per white-label client (no copy in TSX).
   */
  publicPages: {
    home: {
      heading: "Mobile Shop",
      lead: "Browse products and manage your account.",
    },
    login: {
      intro: "Sign in with your email and password.",
      noAccountPrefix: "Don't have an account?",
      registerCta: "Sign Up",
      /** `{business}` is replaced with `STORE_BUSINESS_NAME` for metadata. */
      metaDescription: "Sign in to {business}.",
      fieldEmailLabel: "Email",
      fieldPasswordLabel: "Password",
    },
    register: {
      heading: "Create account",
      intro:
        "Register to start shopping. We will email you a 6-digit code to confirm your address.",
      phonePlaceholder: "e.g. +92 300 1234567",
      confirmPasswordLabel: "Confirm password",
      submitCta: "Register",
      hasAccountPrefix: "Already have an account?",
      loginLinkCta: "Log In",
      metaDescription: "Create an account at {business}.",
    },
    registerVerifyEmail: {
      heading: "Check your email",
      intro:
        "We sent a 6-digit verification code to your inbox. Enter it below to finish creating your account. Check your inbox/spam folders.",
      codeLabel: "Verification code",
      codeHint: "6 digits, no spaces.",
      submitCta: "Verify and create account",
      backToRegisterCta: "Start over",
      metaDescription:
        "Confirm your email to finish registering at {business}.",
    },
  },
  header: {
    searchFieldSrLabel: "Search products",
    searchSubmitAria: "Search",
    searchPlaceholder: "Search for products...",
    menuButtonOpenAria: "Open main menu",
    menuToggleSrOnly: "Toggle menu",
    menuBackdropCloseAria: "Close menu",
    mobileNavDialogAria: "Main navigation",
    mobileNavSecondaryAria: "Mobile",
    accountAriaSignedIn: "Account",
    accountMenuButtonSignedOutAria: "Open account menu",
    loginCta: "Login",
    loginPageInvalidCredentials: "Invalid email or password.",
    cartAria: "Cart",
    admin: "Admin",
    /** Shown beside display name in account popover for admin users */
    accountPopoverAdminBadge: "Admin",
    logout: "Logout",
    shopNavAriaLabel: "Shop by category",
    navViewAllInCategory: "View all",
    mobileNavCategoriesLabel: "Categories",
    mobileNavCloseAria: "Close menu",
    /** Side drawer — signed-out strip above categories */
    mobileNavGuestIntro: "Login. If not registered, create an account.",
    mobileNavSignUpCta: "Sign up",
    accountPopoverWelcomeTitle: "Welcom to Five Star Mobile",
    /** Between email/password login and OAuth (e.g. Google) */
    accountPopoverAuthDividerLabel: "OR",
    accountPopoverLoginHeading: "Log In",
    accountPopoverSignupHeading: "Create Account",
    accountPopoverSignupPasswordHelp: "Enter your details",
    accountSheetCloseAria: "Close account menu",
    accountPopoverSignedInEditHeading: "Edit Profile",
    accountPopoverEditProfileCta: "Edit Profile",
    accountPopoverUpdatePasswordCta: "Update Password",
    accountPopoverViewOrdersCta: "View Orders",
    /** Account popover — replaces View Orders for admin users */
    accountPopoverViewDashboardCta: "View Dashboard",
    accountPopoverPhoneEmpty: "No phone on file",
    accountPopoverSaveProfileCta: "Update",
    accountPopoverCancelEditCta: "Cancel",
    accountPopoverPasswordUpdateHeading: "Update Password",
    accountPopoverOldPasswordLabel: "Current Password",
    accountPopoverNewPasswordLabel: "New Password",
    accountPopoverConfirmNewPasswordLabel: "Confirm New Password",
    accountPopoverSavePasswordCta: "Update",
    accountPopoverDetailsUpdatedMessage: "Details have been updated.",
    accountPopoverChangeProfilePhotoAria: "Change profile photo",
    accountPopoverProfileImageTooLarge:
      "Image is too large. Maximum size is 2 MB.",
    accountPopoverProfileImageInvalid:
      "Please upload a JPEG, PNG, or WebP image.",
    accountPopoverProfileImageUploadFailed:
      "Could not save your photo. Try again.",
    /** Vercel serverless has no persistent disk — set `BLOB_READ_WRITE_TOKEN` (Vercel Blob). */
    accountPopoverProfileImageBlobRequiredOnVercel:
      "Photo upload requires file storage on this host. Ask the site admin to enable Vercel Blob (BLOB_READ_WRITE_TOKEN).",
    accountPopoverProfileImageUploadNetworkError:
      "Upload failed. Check your connection and try again.",
    accountPopoverFirstNameLabel: "First name",
    accountPopoverLastNameLabel: "Last name",
    accountPopoverManageSettingsLine: "Manage your account settings.",
    accountPopoverPhoneLabel: "Phone number",
    accountPopoverProfileUpdateError: "Could not save your profile. Try again.",
    accountPopoverForgotPasswordCta: "Forgot password?",
    accountPopoverForgotHeading: "Reset Password",
    accountPopoverForgotIntro: "Enter your email for a password reset link.",
    accountPopoverSendResetLinkCta: "Send reset link",
    accountPopoverNoAccountQuestion: "Don't have an account?",
    accountPopoverHasAccountQuestion: "Already have an account?",
    /** Inline link labels in account popover footers (sentence + link) */
    accountPopoverSignUpLinkCta: "Sign Up",
    accountPopoverLoginLinkCta: "Log In",
    accountPopoverGoogleLoginCta: "Log in with Google",
    accountPopoverResetEmailSent:
      "If an account exists for that email, we've sent password reset instructions. Check your inbox/spam folders.",
    accountPopoverBackToLogin: "Back to log in",
    /** Post-login / post-register confirmation sheet */
    accountAuthSuccessTitle: "Oh Yeah!",
    accountAuthSuccessMessage: "You have successfully logged in.",
    accountAuthSuccessMessageAfterRegister:
      "You have successfully registered and logged in.",
    accountAuthSuccessOk: "Ok",
    accountAuthSuccessBackdropAria: "Dismiss",
    accountLogoutSuccessTitle: "Goodbye for Now!",
    accountLogoutSuccessMessage: "You have successfully logged out.",
    /** Screen reader label for the 👋 shown beside the logout success title */
    accountLogoutSuccessEmojiAria: "Waving hand goodbye",
  },
  footer: {
    visitHeading: "Visit Our Store",
    mapHint: "Zoom the map for directions.",
    openInGoogleMaps: "Open in Google Maps",
    paymentsHeading: "Secure Payments Methods",
    paymentMethodsImageAlt:
      "Visa, Mastercard, and other accepted payment methods",
    phoneFallbackLink: "Phone & directions — Contact",
    emailFallbackLink: "Email us via Contact",
  },
  socialLabels: {
    whatsapp: "WhatsApp",
    youtube: "YouTube",
    instagram: "Instagram",
    tiktok: "TikTok",
  },
  categorySlider: {
    sectionAriaLabel: "Shop by category",
    prevAriaLabel: "Show previous categories",
    nextAriaLabel: "Show next categories",
  },
  heroBanner: {
    sectionAriaLabel: "Featured products",
    dotsNavAriaLabel: "Choose a featured product slide",
  },
  /** Home / header strip — images in `public/assets/category/` */
  categorySlides: [
    {
      label: "Mobiles",
      imageSrc: "/assets/category/Mobile.webp",
      href: "/categories?category=smartphones",
    },
    {
      label: "Earbuds",
      imageSrc: "/assets/category/Earbuds.webp",
      href: "/categories?category=earbuds",
    },
    {
      label: "Smart watches",
      imageSrc: "/assets/category/Watch.webp",
      href: "/categories?category=smart-watches",
    },
    {
      label: "Power banks",
      imageSrc: "/assets/category/Power-Bank.webp",
      href: "/categories?category=power-banks",
    },
    {
      label: "Data cables",
      imageSrc: "/assets/category/Cable.webp",
      href: "/categories?category=data-cables",
    },
    {
      label: "Chargers",
      imageSrc: "/assets/category/Charger.webp",
      href: "/categories?category=chargers",
    },
    {
      label: "Speakers",
      imageSrc: "/assets/category/Speaker.webp",
      href: "/categories?category=speakers",
    },
    {
      label: "Tablets",
      imageSrc: "/assets/category/Tablet.webp",
      href: "/categories?category=tablets",
    },
    {
      label: "Headphones",
      imageSrc: "/assets/category/Headphones.webp",
      href: "/categories?category=headphones",
    },
    {
      label: "Car accessories",
      imageSrc: "/assets/category/Car-Accessories.webp",
      href: "/categories?category=car-accessories",
    },
  ],
  social: {
    instagram: "https://www.instagram.com/five_star_mobile",
    youtube: "https://www.youtube.com/@five_star_mobile",
    tiktok: "https://www.tiktok.com/@five_star_mobile",
    whatsapp: "https://wa.me/923214385252",
  },
} as const;

// --- Identity & contact ---

export const SITE_URL = SITE_DEFAULTS.siteUrl;

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

export const SITE_HOME_PAGE = SITE_DEFAULTS.publicPages.home;

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
