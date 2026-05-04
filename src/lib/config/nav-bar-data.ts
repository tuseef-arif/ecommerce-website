/**
 * Main storefront header navigation — edit arrays here (same idea as `hero-page.ts`).
 * Desktop: first three entries render as dropdowns; `STORE_NAV_BAR_MORE_ITEMS` is the “More” menu.
 * Query params align with `categorySlides` in `site-config.ts` (`/categories?category=…`).
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
    categoryHref: "/categories?category=smartphones",
    children: [
      {
        id: "samsung",
        label: "Samsung",
        href: "/categories?category=smartphones&brand=samsung",
      },
      {
        id: "oppo",
        label: "Oppo",
        href: "/categories?category=smartphones&brand=oppo",
      },
      {
        id: "infinix",
        label: "Infinix",
        href: "/categories?category=smartphones&brand=infinix",
      },
      {
        id: "xiaomi",
        label: "Xiaomi",
        href: "/categories?category=smartphones&brand=xiaomi",
      },
      {
        id: "vivo",
        label: "Vivo",
        href: "/categories?category=smartphones&brand=vivo",
      },
      {
        id: "tecno",
        label: "Tecno",
        href: "/categories?category=smartphones&brand=tecno",
      },
      {
        id: "realme",
        label: "Realme",
        href: "/categories?category=smartphones&brand=realme",
      },
      {
        id: "honor",
        label: "Honor",
        href: "/categories?category=smartphones&brand=honor",
      },
      {
        id: "iphone",
        label: "iPhone",
        href: "/categories?category=smartphones&brand=iphone",
      },
    ],
  },
  {
    id: "earbuds",
    label: "Earbuds",
    categoryHref: "/categories?category=earbuds",
    children: [
      {
        id: "xiaomi",
        label: "Xiaomi",
        href: "/categories?category=earbuds&brand=xiaomi",
      },
      {
        id: "audionic",
        label: "Audionic",
        href: "/categories?category=earbuds&brand=audionic",
      },
      {
        id: "zero",
        label: "Zero",
        href: "/categories?category=earbuds&brand=zero",
      },
      {
        id: "ronnin",
        label: "Ronnin",
        href: "/categories?category=earbuds&brand=ronnin",
      },
    ],
  },
  {
    id: "smart-watches",
    label: "Smart Watches",
    categoryHref: "/categories?category=smart-watches",
    children: [
      {
        id: "faster",
        label: "Faster",
        href: "/categories?category=smart-watches&brand=faster",
      },
      {
        id: "nothing",
        label: "Nothing",
        href: "/categories?category=smart-watches&brand=nothing",
      },
      {
        id: "zero",
        label: "Zero",
        href: "/categories?category=smart-watches&brand=zero",
      },
      {
        id: "dany",
        label: "Dany",
        href: "/categories?category=smart-watches&brand=dany",
      },
      {
        id: "samsung",
        label: "Samsung",
        href: "/categories?category=smart-watches&brand=samsung",
      },
      {
        id: "huaview",
        label: "Huaview",
        href: "/categories?category=smart-watches&brand=huaview",
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
    href: "/categories?category=power-banks",
  },
  {
    id: "data-cables",
    label: "Data cables",
    href: "/categories?category=data-cables",
  },
  {
    id: "chargers",
    label: "Chargers",
    href: "/categories?category=chargers",
  },
  {
    id: "speakers",
    label: "Speakers",
    href: "/categories?category=speakers",
  },
  {
    id: "tablets",
    label: "Tablets",
    href: "/categories?category=tablets",
  },
  {
    id: "headphones",
    label: "Headphones",
    href: "/categories?category=headphones",
  },
  {
    id: "car-accessories",
    label: "Car accessories",
    href: "/categories?category=car-accessories",
  },
];

export const NAV_BAR_MORE_BUTTON_LABEL = "More";
