"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";
import {
  SITE_CATEGORY_SLIDER,
  SITE_CATEGORY_SLIDES,
  STORE_SHELL,
} from "@/lib/config/site-config";
import { CATEGORY_SLIDER_SCROLL_DURATION_MS } from "@/lib/constants/ui-timeouts";
import { FROSTED_SLIDER_ARROW_CLASS } from "./store-slider-arrows";
const SCROLL_FRACTION = 0.38;
const SCROLL_MAX_PX = 240;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

export const CategorySlider = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAnimRef = useRef<number | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanPrev(scrollLeft > 2);
    setCanNext(scrollLeft < scrollWidth - clientWidth - 2);
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
  }, [updateEdges]);

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const stepPx = Math.min(el.clientWidth * SCROLL_FRACTION, SCROLL_MAX_PX);
    const next = el.scrollLeft + dir * stepPx;
    animateScrollTo(next);
  };

  return (
    <section
      className="border-b border-neutral-100 bg-white"
      aria-label={SITE_CATEGORY_SLIDER.sectionAriaLabel}
    >
      <div className={`relative ${STORE_SHELL}`}>
        <button
          type="button"
          className={`${FROSTED_SLIDER_ARROW_CLASS} left-2 lg:left-3`}
          aria-label={SITE_CATEGORY_SLIDER.prevAriaLabel}
          disabled={!canPrev}
          onClick={() => scrollByDir(-1)}
        >
          <IconChevronLeft />
        </button>

        <div
          ref={scrollRef}
          className="store-category-slider__track flex snap-x snap-mandatory gap-5 overflow-x-auto py-4 sm:gap-6 md:gap-7 md:snap-none lg:gap-8"
        >
          {SITE_CATEGORY_SLIDES.map(({ href, imageSrc, label }) => (
            <Link
              key={href}
              href={href}
              className="group flex w-[4.75rem] shrink-0 snap-start flex-col items-center gap-2 rounded-md border-b-[3px] border-transparent bg-transparent px-1.5 pb-1 pt-1.5 transition-[background-color,border-color] duration-200 ease-out hover:border-[var(--store-brand-primary)] hover:bg-[#f2f2f2] focus-visible:border-[var(--store-brand-primary)] focus-visible:bg-[#f2f2f2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)] sm:w-[5.25rem] md:w-28"
            >
              <span className="relative flex h-16 w-full items-center justify-center overflow-hidden sm:h-[4.5rem] md:h-20">
                <Image
                  src={imageSrc}
                  alt=""
                  width={96}
                  height={96}
                  className="max-h-full w-auto object-contain transition-transform duration-200 ease-out group-hover:scale-105 group-focus-visible:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-focus-visible:scale-100"
                  sizes="(max-width: 768px) 72px, 96px"
                />
              </span>
              <span className="w-full text-center text-[0.6875rem] font-medium leading-tight text-neutral-900 transition-colors duration-200 ease-out group-hover:text-[var(--store-brand-primary)] group-focus-visible:text-[var(--store-brand-primary)] sm:text-xs">
                {label}
              </span>
            </Link>
          ))}
        </div>

        <button
          type="button"
          className={`${FROSTED_SLIDER_ARROW_CLASS} right-2 lg:right-3`}
          aria-label={SITE_CATEGORY_SLIDER.nextAriaLabel}
          disabled={!canNext}
          onClick={() => scrollByDir(1)}
        >
          <IconChevronRight />
        </button>
      </div>
    </section>
  );
};
