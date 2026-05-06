"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";
import { ProductCard } from "@/components/store/product-card";
import { FROSTED_SLIDER_ARROW_CLASS } from "@/components/store/store-slider-arrows";
import { SITE_PRODUCT_SLIDER } from "@/lib/config/site-config";
import { CATEGORY_SLIDER_SCROLL_DURATION_MS } from "@/lib/constants/ui-timeouts";
import type { StorefrontProductCardItem } from "@/lib/products/storefront-types";

const SCROLL_FRACTION = 0.38;
const SCROLL_MAX_PX = 240;
/** Edge tolerance in pixels — sub-pixel rounding can leave 1px gaps after scroll. */
const EDGE_EPSILON = 2;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

type ProductSliderProps = {
  products: ReadonlyArray<StorefrontProductCardItem>;
  /** Optional rail title rendered above the track. */
  title?: string;
  /** When provided, renders a "View all" link beside the title. */
  viewAllHref?: string;
  /** Override the default "View all" CTA copy. */
  viewAllLabel?: string;
  /** Accessible label for the section element. Falls back to `title` or config copy. */
  ariaLabel?: string;
  /** First product in the rail can preload its image (LCP) when this is true. */
  prioritizeFirstImage?: boolean;
  /** Override default empty state. */
  emptyState?: ReactNode;
  className?: string;
};

/**
 * Reusable horizontal product rail with smooth-scrolling arrows.
 * Defaults to rendering `<ProductCard />` per item; the slider chrome
 * (track, snap, arrows, edge state) is the primary value.
 */
export const ProductSlider = ({
  products,
  title,
  viewAllHref,
  viewAllLabel,
  ariaLabel,
  prioritizeFirstImage = false,
  emptyState,
  className,
}: ProductSliderProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAnimRef = useRef<number | null>(null);
  const headingId = useId();
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setCanPrev(scrollLeft > EDGE_EPSILON);
    setCanNext(scrollLeft < maxScroll - EDGE_EPSILON);
  }, []);

  const animateScrollTo = useCallback(
    (targetLeft: number) => {
      const el = scrollRef.current;
      if (!el) return;

      if (scrollAnimRef.current !== null) {
        cancelAnimationFrame(scrollAnimRef.current);
        scrollAnimRef.current = null;
      }

      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
      const to = Math.max(0, Math.min(maxScroll, targetLeft));

      if (prefersReduced) {
        el.scrollLeft = to;
        updateEdges();
        return;
      }

      const start = el.scrollLeft;
      const delta = to - start;
      if (Math.abs(delta) < 0.5) {
        updateEdges();
        return;
      }

      const t0 = performance.now();

      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / CATEGORY_SLIDER_SCROLL_DURATION_MS);
        el.scrollLeft = start + delta * easeOutCubic(p);
        if (p < 1) {
          scrollAnimRef.current = requestAnimationFrame(step);
        } else {
          scrollAnimRef.current = null;
          updateEdges();
        }
      };

      scrollAnimRef.current = requestAnimationFrame(step);
    },
    [updateEdges],
  );

  useEffect(() => {
    updateEdges();
    const el = scrollRef.current;
    if (!el) return undefined;

    const onScroll = () => updateEdges();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => updateEdges());
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
      if (scrollAnimRef.current !== null) {
        cancelAnimationFrame(scrollAnimRef.current);
      }
    };
  }, [updateEdges, products.length]);

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const stepPx = Math.min(el.clientWidth * SCROLL_FRACTION, SCROLL_MAX_PX);
    animateScrollTo(el.scrollLeft + dir * stepPx);
  };

  if (products.length === 0) {
    return (
      <section
        aria-label={ariaLabel ?? title ?? SITE_PRODUCT_SLIDER.sectionAriaLabel}
        className={className}
      >
        {title ? (
          <header className="mb-3 flex items-end justify-between gap-3">
            <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">
              {title}
            </h2>
          </header>
        ) : null}
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-8 text-center text-sm text-neutral-500">
          {emptyState ?? SITE_PRODUCT_SLIDER.emptyState}
        </div>
      </section>
    );
  }

  const sectionAriaProps = title
    ? { "aria-labelledby": headingId }
    : {
        "aria-label": ariaLabel ?? SITE_PRODUCT_SLIDER.sectionAriaLabel,
      };

  return (
    <section className={className} {...sectionAriaProps}>
      {(title || viewAllHref) && (
        <header className="mb-3 flex items-end justify-between gap-3">
          {title ? (
            <h2
              id={headingId}
              className="text-lg font-semibold text-neutral-900 sm:text-xl"
            >
              {title}
            </h2>
          ) : (
            <span />
          )}
          {viewAllHref ? (
            <Link
              href={viewAllHref}
              className="shrink-0 text-sm font-semibold text-[var(--store-brand-primary)] underline-offset-4 transition-[color,text-decoration-color] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
            >
              {viewAllLabel ?? SITE_PRODUCT_SLIDER.viewAllLabel}
              <span aria-hidden> →</span>
            </Link>
          ) : null}
        </header>
      )}

      <div className="relative">
        <button
          type="button"
          className={`${FROSTED_SLIDER_ARROW_CLASS} -left-2 lg:-left-3`}
          aria-label={SITE_PRODUCT_SLIDER.prevAriaLabel}
          aria-controls={`${headingId}-track`}
          disabled={!canPrev}
          onClick={() => scrollByDir(-1)}
        >
          <IconChevronLeft />
        </button>

        <div
          id={`${headingId}-track`}
          ref={scrollRef}
          role="group"
          aria-label={
            ariaLabel ?? title ?? SITE_PRODUCT_SLIDER.sectionAriaLabel
          }
          className="store-product-slider__track flex snap-x snap-mandatory gap-3 overflow-x-auto py-2 sm:gap-4 md:gap-5 md:snap-none"
        >
          {products.map((product, idx) => (
            <ProductCard
              key={product.id}
              product={product}
              isPriority={prioritizeFirstImage && idx === 0}
            />
          ))}
        </div>

        <button
          type="button"
          className={`${FROSTED_SLIDER_ARROW_CLASS} -right-2 lg:-right-3`}
          aria-label={SITE_PRODUCT_SLIDER.nextAriaLabel}
          aria-controls={`${headingId}-track`}
          disabled={!canNext}
          onClick={() => scrollByDir(1)}
        >
          <IconChevronRight />
        </button>
      </div>
    </section>
  );
};
