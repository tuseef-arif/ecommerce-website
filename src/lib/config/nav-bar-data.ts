/**
 * Main storefront header navigation — edit arrays here (same idea as `hero-page.ts`).
 * Desktop: first three entries render as dropdowns; `STORE_NAV_BAR_MORE_ITEMS` is the “More” menu.
 * Query params align with `categorySlides` in `site-config.ts` (`/products?category=…`).
 *
 * **Brand identity**
 * - Use one canonical `id` + `label` per brand (e.g. `xiaomi` / `Xiaomi`, `samsung` / `Samsung`) everywhere it appears.
 * - Do not suffix ids (`-mobile`, `-earbuds`); category is already in `href` (`category=` / `brand=`).
 * - `id` must be unique only within that group’s `children` array; UI keys combine group `id` + brand `id`.
 */

export type NavBarSubLink = {
  /** Canonical brand slug — same as `brand` in `href`; reuse across categories when the brand repeats */
  id: string;
  /** Display name — same spelling/casing whenever that brand appears in another group */
  label: string;
  href: string;
};

export type NavBarDropdownGroup = {
  /** Category key for URLs / UI — slug-case, stable */
  id: string;
  /** Category label shown in the nav */
  label: string;
  /** “View all” / parent category */
  categoryHref: string;
  children: NavBarSubLink[];
};

export type NavBarMoreItem = {
  /** Category slug — matches `category` in `href` */
  id: string;
  label: string;
  href: string;
};

/** First three groups — shown as individual dropdowns on desktop */
export const STORE_NAV_BAR_DROPDOWNS: NavBarDropdownGroup[] = [
  {
    id: "mobiles",
    label: "Mobiles",
    categoryHref: "/products?category=mobiles",
    children: [
      {
        id: "samsung",
        label: "Samsung",
        href: "/products?category=mobiles&brand=samsung",
      },
      {
        id: "oppo",
        label: "Oppo",
        href: "/products?category=mobiles&brand=oppo",
      },
      {
        id: "infinix",
        label: "Infinix",
        href: "/products?category=mobiles&brand=infinix",
      },
      {
        id: "xiaomi",
        label: "Xiaomi",
        href: "/products?category=mobiles&brand=xiaomi",
      },
      {
        id: "vivo",
        label: "Vivo",
        href: "/products?category=mobiles&brand=vivo",
      },
      {
        id: "tecno",
        label: "Tecno",
        href: "/products?category=mobiles&brand=tecno",
      },
      {
        id: "realme",
        label: "Realme",
        href: "/products?category=mobiles&brand=realme",
      },
      {
        id: "honor",
        label: "Honor",
        href: "/products?category=mobiles&brand=honor",
      },
      {
        id: "iphone",
        label: "iPhone",
        href: "/products?category=mobiles&brand=iphone",
      },
    ],
  },
  {
    id: "earbuds",
    label: "Earbuds",
    categoryHref: "/products?category=earbuds",
    children: [
      {
        id: "xiaomi",
        label: "Xiaomi",
        href: "/products?category=earbuds&brand=xiaomi",
      },
      {
        id: "audionic",
        label: "Audionic",
        href: "/products?category=earbuds&brand=audionic",
      },
      {
        id: "zero",
        label: "Zero",
        href: "/products?category=earbuds&brand=zero",
      },
      {
        id: "ronnin",
        label: "Ronnin",
        href: "/products?category=earbuds&brand=ronnin",
      },
    ],
  },
  {
    id: "smart-watches",
    label: "Smart Watches",
    categoryHref: "/products?category=smart-watches",
    children: [
      {
        id: "faster",
        label: "Faster",
        href: "/products?category=smart-watches&brand=faster",
      },
      {
        id: "nothing",
        label: "Nothing",
        href: "/products?category=smart-watches&brand=nothing",
      },
      {
        id: "zero",
        label: "Zero",
        href: "/products?category=smart-watches&brand=zero",
      },
      {
        id: "dany",
        label: "Dany",
        href: "/products?category=smart-watches&brand=dany",
      },
      {
        id: "samsung",
        label: "Samsung",
        href: "/products?category=smart-watches&brand=samsung",
      },
      {
        id: "huaview",
        label: "Huaview",
        href: "/products?category=smart-watches&brand=huaview",
      },
    ],
  },
];

/**
 * Remaining storefront categories (not covered by the three dropdowns above).
 * Mirrors the other `categorySlides` entries in `site-config.ts`.
 */
export const STORE_NAV_BAR_MORE_ITEMS: NavBarMoreItem[] = [
  {
    id: "power-banks",
    label: "Power banks",
    href: "/products?category=power-banks",
  },
  {
    id: "data-cables",
    label: "Data cables",
    href: "/products?category=data-cables",
  },
  {
    id: "chargers",
    label: "Chargers",
    href: "/products?category=chargers",
  },
  {
    id: "speakers",
    label: "Speakers",
    href: "/products?category=speakers",
  },
  {
    id: "tablets",
    label: "Tablets",
    href: "/products?category=tablets",
  },
  {
    id: "headphones",
    label: "Headphones",
    href: "/products?category=headphones",
  },
  {
    id: "car-accessories",
    label: "Car accessories",
    href: "/products?category=car-accessories",
  },
];

export const NAV_BAR_MORE_BUTTON_LABEL = "More";
