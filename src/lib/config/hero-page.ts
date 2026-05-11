/**
 * Featured hero phones — add entries to rotate the storefront hero.
 * Images live under `public/assets/hero/`.
 */

export type HeroPhone = {
  id: string;
  /** Display title (e.g. product line name) */
  name: string;
  /** Short spec lines shown as bullets */
  specs: string[];
  /** Path under `public/` */
  imageSrc: string;
  /** Descriptive alt for the hero image */
  imageAlt: string;
  /**
   * Where clicking the banner navigates. `null`/`undefined` means the slide
   * has no linked products and should render as a non-interactive card.
   */
  href?: string | null;
};

export const HERO_PHONES: HeroPhone[] = [
  {
    id: "infinix-note-60-pro",
    name: "Infinix Note 60 Pro",
    specs: [
      "Snapdragon 7s Gen 4",
      "5G Performance",
      "Active Matrix Display",
      "144Hz 1.5K Ultra HDR",
      "50MP OIS Night",
      "90W 6500mAh Battery",
      "Wireless Charging",
    ],
    imageSrc: "/assets/hero/note60-pro.webp",
    imageAlt: "Infinix Note 60 Pro smartphone",
  },
  {
    id: "oppo-find-x9",
    name: "Oppo Find X9",
    specs: [
      "7,025mAh Silicon-Carbon Battery",
      "MediaTek Dimensity 9500 (3nm) Chipset",
      "IP69 Dust and Water Resistance",
      "3,600 Nits Peak Brightness 1.5K AMOLED Display",
      "Triple 50MP Hasselblad Camera System",
      "4K at 120fps Dolby Vision Video Recording",
      'Customizable "Snap Key" Physical Button',
      "80W Wired / 50W Wireless Charging Speed",
    ],
    imageSrc: "/assets/hero/oppo-find-x.webp",
    imageAlt: "Oppo Find X9 smartphone",
  },
  {
    id: "samsung-galaxy-s26-ultra",
    name: "Samsung S26 Ultra",
    specs: [
      'Snapdragon 8 Elite Gen 5 (3nm) "For Galaxy"',
      "Privacy Display (integrated hardware-level privacy filter)",
      "200MP main sensor with a wider f/1.4 aperture",
      "50MP periscope telephoto with 5x optical zoom",
      "6.9-inch Dynamic LTPO AMOLED 2X (2,800 nits peak)",
      "60W wired SuperCharge 3.0",
      "7 generations of Android OS and security updates",
      "Built-in S Pen with enhanced AI gesture support",
    ],
    imageSrc: "/assets/hero/s26-ultra.jpg",
    imageAlt: "Samsung Galaxy S26 Ultra smartphone",
  },
  {
    id: "iphone-17-pro-max",
    name: "iPhone 17 Pro Max",
    specs: [
      "Released Sep 2025, flagship device",
      "A19 Pro chip, 6-core GPU",
      "Vapor chamber for better cooling",
      "6.9-inch XDR, 3,000 nits",
      "Triple 48MP Fusion camera system",
      "4x, 8x optical-quality zoom",
      "4K 120fps Dolby Vision video",
      "12GB LPDDR5X RAM, fast AI",
      "MIE hardware security, advanced protection",
    ],
    imageSrc: "/assets/hero/iphone-17.png",
    imageAlt: "iPhone 17 Pro Max smartphone",
  },
];
