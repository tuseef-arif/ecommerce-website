/**
 * Shared admin types for the hero banner CRUD surface.
 * Decoupled from Prisma so `'use client'` files (forms, tables) can import freely.
 */

/**
 * Compact product summary used by the admin "linked products" picker.
 * Pulled from `prisma.product` and trimmed for the wire.
 */
export type AdminHeroLinkedProduct = {
  id: string;
  name: string;
  brand: string;
  slug: string;
  imagePath: string | null;
};

export type AdminHeroSlideListItem = {
  id: string;
  name: string;
  imageAlt: string;
  imagePath: string | null;
  specs: ReadonlyArray<string>;
  sortOrder: number;
  isActive: boolean;
  linkedProductCount: number;
  updatedAtIso: string;
};

export type AdminHeroSlideDetail = {
  id: string;
  name: string;
  imageAlt: string;
  imagePath: string | null;
  specs: ReadonlyArray<string>;
  sortOrder: number;
  isActive: boolean;
  linkedProducts: ReadonlyArray<AdminHeroLinkedProduct>;
};

export type AdminHeroSlidesListStatus =
  | "created"
  | "updated"
  | "deleted"
  | null;
