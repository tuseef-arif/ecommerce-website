/** Non-secret site data — edit here */
export const SITE_DEFAULTS = {
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
    checkout: "/checkout",
    /** Staff dashboard (route implemented separately) */
    dashboard: "/dashboard",
    /** Internal landing after sign-in; redirects to dashboard or home by role. */
    postLogin: "/post-login",
    accountOrders: "/account/orders",
  },
  /**
   * Public marketing/auth pages — edit per white-label client (no copy in TSX).
   */
  publicPages: {
    home: {
      /**
       * Per-category product rails shown under the hero banner.
       * `categorySlug` must match a row in the `Category` table; missing
       * categories simply render nothing (no broken UI).
       */
      productRails: [
        {
          categorySlug: "mobiles",
          title: "Mobiles",
          viewAllHref: "/products?category=mobiles",
        },
        {
          categorySlug: "earbuds",
          title: "Earbuds",
          viewAllHref: "/products?category=earbuds",
        },
        {
          categorySlug: "smart-watches",
          title: "Smart Watches",
          viewAllHref: "/products?category=smart-watches",
        },
      ],
    },
    /**
     * Public products listing page (`/products?category=…&brand=…`).
     * Categories are validated against the database; the `brand` param is a
     * free-text filter and shown as a chip the shopper can clear. White-label
     * friendly — keep TSX free of marketing strings.
     */
    productsListing: {
      pageHeadingAllProducts: "All products",
      breadcrumbHomeLabel: "Home",
      breadcrumbAllProductsLabel: "Products",
      filterCategoryLabel: "Category",
      filterCategoryAllOptionLabel: "All categories",
      filterBrandLabel: "Brand",
      filterBrandAllOptionLabel: "All brands",
      filterSortByLabel: "Sort by",
      filterSortLatestLabel: "Latest",
      filterSortPriceHighToLowLabel: "Price: high to low",
      filterSortPriceLowToHighLabel: "Price: low to high",
      brandChipPrefix: "Brand:",
      clearBrandFilterLabel: "Clear",
      clearBrandFilterAriaLabel: "Clear brand filter",
      emptyStateTitle: "No products found",
      emptyStateLead:
        "We couldn't find products for this filter. Try clearing the filter or browse another category.",
      emptyStateBrowseAllCta: "Browse all products",
      loadingMoreLabel: "Loading more products…",
      loadMoreCta: "Load more",
      loadMoreErrorMessage: "Could not load more products. Try again.",
      loadMoreRetryCta: "Retry",
      endOfListLabel: "NO MORE PRODUCTS IN THIS CATEGORY",
      resultCountSingular: "1 Product",
      /** `{count}` is replaced with the formatted total. */
      resultCountPattern: "{count} Products",
      /**
       * Used in <title>; the root layout adds the `| {business}` suffix via
       * the `title.template`, so the patterns below intentionally omit it.
       * Supports `{category}` and `{brand}` interpolation only.
       */
      metaTitleCategoryPattern: "{category}",
      metaTitleCategoryAndBrandPattern: "{brand} {category}",
      metaTitleAllPattern: "All products",
      metaDescriptionCategoryPattern:
        "Shop {category} at {business} — genuine devices, clear pricing, reliable service.",
      metaDescriptionCategoryAndBrandPattern:
        "Shop {brand} {category} at {business} — genuine devices, clear pricing.",
      metaDescriptionAllPattern:
        "Browse all products at {business} — phones, accessories, and more.",
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
    admin: "Dashboard",
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
    accountPopoverAddressLabel: "Address",
    accountPopoverCityLabel: "City",
    accountPopoverCountryLabel: "Country",
    accountPopoverLocationEmpty: "No address on file",
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
    phoneFallbackLink: "Phone & directions — see footer",
    emailFallbackLink: "Email — see footer",
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
  productSlider: {
    /** ARIA label fallback when a slider does not get its own from the rail title. */
    sectionAriaLabel: "Products",
    prevAriaLabel: "Show previous products",
    nextAriaLabel: "Show next products",
    addToCartLabel: "Add to cart",
    viewAllLabel: "View all",
    saleBadgeLabel: "Sale!",
    /**
     * Suffix appended to the discount badge value
     * (e.g. `25% OFF`, `Rs 5,000 OFF`). Tweak per locale.
     */
    discountBadgeSuffix: "OFF",
    /** Currency prefix shown before formatted amounts (e.g. "Rs 11,799"). */
    pricePrefix: "Rs",
    emptyState: "No products to show yet.",
    productLinkPrefix: "/products",
  },
  /**
   * Admin product form copy (Edit/New pages). White-label friendly.
   */
  productForm: {
    colorsLegend: "Color options",
    colorsHelper:
      "Add the colors this product is available in (one per row). Empty rows are ignored.",
    colorsRowPlaceholder: "e.g. Midnight Black",
    colorsAddCta: "+ Add color",
    storagesLegend: "Storage options",
    storagesHelper:
      "Add the storage variants this product comes in (one per row, e.g. 128 GB).",
    storagesRowPlaceholder: "e.g. 128 GB",
    storagesAddCta: "+ Add storage",
    optionRowRemoveAria: "Remove option",
    /**
     * Helper shown under each option list. The first option is treated as the
     * base — keep its extra at 0; charge a premium on others by entering an
     * amount (e.g. 500 means +Rs 500 on the base price for that variant).
     */
    optionDeltaHelper:
      "Add an extra cost per option to bump the price when shoppers pick that variant. Leave blank or 0 for base price.",
    /** Screen reader label for the per-row delta input. */
    optionDeltaSrLabel: "Extra cost",
  },
  /**
   * Public product detail page (`/products/[slug]`).
   * Edit per white-label client — keep TSX free of marketing strings.
   */
  productDetail: {
    metaDescriptionFallback: "Shop authentic accessories at clear prices.",
    breadcrumbHomeLabel: "Home",
    breadcrumbCategoryFallback: "All products",
    brandLabelPrefix: "By",
    modelLabel: "Model",
    inStockLabel: "In stock",
    outOfStockLabel: "Out of stock",
    descriptionHeading: "About this product",
    keyFeaturesHeading: "Key features",
    colorOptionsHeading: "Available colors",
    /** Heading for the storage options dropdown on the detail page. */
    storageOptionsHeading: "Storage",
    /** Inline label rendered next to the storefront color dropdown. */
    colorSelectLabel: "Color",
    /** Placeholder shown when an admin hasn't entered any options yet. */
    variantSelectPlaceholder: "Choose an option",
    /**
     * Suffix appended to a variant option label when it carries a positive
     * `priceDelta`, e.g. `"White (+Rs 500)"`. The "+" + formatted amount are
     * built in the component; this stays as the parenthetical wrapper.
     */
    variantOptionDeltaPrefix: "+",
    specsHeading: "Specifications",
    specsEmpty: "Detailed specifications will be added soon.",
    relatedHeading: "More from {category}",
    relatedViewAllLabel: "Browse all",
    addToCartLabel: "Add to Cart",
    addToCartDisabledLabel: "Out of stock",
    compareLabel: "Compare",
    compareAriaLabel: "Add to compare list",
    notFoundTitle: "Product not found",
    notFoundLead:
      "The product you’re looking for is no longer available. Browse the categories instead.",
    backToHomeCta: "Back to home",
  },
  /** Home / header strip — images in `public/assets/category/` */
  categorySlides: [
    {
      label: "Mobiles",
      imageSrc: "/assets/category/Mobile.webp",
      href: "/products?category=mobiles",
    },
    {
      label: "Earbuds",
      imageSrc: "/assets/category/Earbuds.webp",
      href: "/products?category=earbuds",
    },
    {
      label: "Smart watches",
      imageSrc: "/assets/category/Watch.webp",
      href: "/products?category=smart-watches",
    },
    {
      label: "Power banks",
      imageSrc: "/assets/category/Power-Bank.webp",
      href: "/products?category=power-banks",
    },
    {
      label: "Data cables",
      imageSrc: "/assets/category/Cable.webp",
      href: "/products?category=data-cables",
    },
    {
      label: "Chargers",
      imageSrc: "/assets/category/Charger.webp",
      href: "/products?category=chargers",
    },
    {
      label: "Speakers",
      imageSrc: "/assets/category/Speaker.webp",
      href: "/products?category=speakers",
    },
    {
      label: "Tablets",
      imageSrc: "/assets/category/Tablet.webp",
      href: "/products?category=tablets",
    },
    {
      label: "Headphones",
      imageSrc: "/assets/category/Headphones.webp",
      href: "/products?category=headphones",
    },
    {
      label: "Car accessories",
      imageSrc: "/assets/category/Car-Accessories.webp",
      href: "/products?category=car-accessories",
    },
  ],
  social: {
    instagram: "https://www.instagram.com/five_star_mobile",
    youtube: "https://www.youtube.com/@five_star_mobile",
    tiktok: "https://www.tiktok.com/@five_star_mobile",
    whatsapp: "https://wa.me/923214385252",
  },
} as const;
