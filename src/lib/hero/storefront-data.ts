import "server-only";

import { prisma } from "@/lib/prisma";
import { HERO_PHONES, type HeroPhone } from "@/lib/config/hero-page";
import { specsJsonToList } from "@/lib/hero/specs";
import { listStorefrontProductsByIds } from "@/lib/products/storefront-data";
import type { StorefrontProductCardItem } from "@/lib/products/storefront-types";

/**
 * Builds the click-through `href` for a slide based on its **active** linked
 * products. Inactive links are ignored so a banner never sends a shopper to
 * a 404 detail page.
 *
 * - 1 active link  → `/products/[slug]` (direct deep-link)
 * - 2+ active     → `/banner/[slideId]` (curated grid)
 * - 0 active     → `null` (banner renders as non-clickable)
 */
const computeHeroHref = (
  slideId: string,
  activeSlugs: ReadonlyArray<string>,
): string | null => {
  if (activeSlugs.length === 0) return null;
  if (activeSlugs.length === 1) return `/products/${activeSlugs[0]}`;
  return `/banner/${slideId}`;
};

/**
 * Active hero slides, ordered for the storefront rotator.
 * Falls back to the bundled `HERO_PHONES` config when no admin-managed rows
 * exist yet so a fresh install never shows a blank hero. Slides without an
 * `imagePath` are skipped (the storefront layout requires an image).
 */
export const listStorefrontHeroSlides = async (): Promise<HeroPhone[]> => {
  try {
    const rows = await prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        imagePath: true,
        imageAlt: true,
        specs: true,
        products: {
          where: { product: { isActive: true } },
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
          select: { product: { select: { slug: true } } },
        },
      },
    });

    const slides: HeroPhone[] = [];
    for (const row of rows) {
      if (!row.imagePath) continue;
      const activeSlugs = row.products.map((link) => link.product.slug);
      slides.push({
        id: row.id,
        name: row.name,
        specs: specsJsonToList(row.specs),
        imageSrc: row.imagePath,
        imageAlt: row.imageAlt,
        href: computeHeroHref(row.id, activeSlugs),
      });
    }

    return slides.length > 0 ? slides : HERO_PHONES;
  } catch (error) {
    // If the table is missing on a stale environment, surface the bundled
    // config rather than blanking the page.
    console.error("listStorefrontHeroSlides failed; using fallback", { error });
    return HERO_PHONES;
  }
};

export type StorefrontHeroSlidePageData = {
  id: string;
  name: string;
  imagePath: string | null;
  imageAlt: string;
  items: StorefrontProductCardItem[];
};

/**
 * Resolves the curated grid shown at `/banner/[slideId]`. Returns `null` when
 * the slide is inactive/missing or no active products remain (single-product
 * slides deep-link to the detail page instead, so this endpoint always
 * surfaces 2+ items in practice).
 */
export const getStorefrontHeroSlidePage = async (
  slideId: string,
): Promise<StorefrontHeroSlidePageData | null> => {
  const id = slideId.trim();
  if (id.length === 0) return null;

  const row = await prisma.heroSlide.findFirst({
    where: { id, isActive: true },
    select: {
      id: true,
      name: true,
      imagePath: true,
      imageAlt: true,
      products: {
        where: { product: { isActive: true } },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: { productId: true },
      },
    },
  });
  if (!row) return null;

  const productIds = row.products.map((link) => link.productId);
  if (productIds.length === 0) return null;

  const items = await listStorefrontProductsByIds(productIds);
  if (items.length === 0) return null;

  return {
    id: row.id,
    name: row.name,
    imagePath: row.imagePath,
    imageAlt: row.imageAlt,
    items,
  };
};
