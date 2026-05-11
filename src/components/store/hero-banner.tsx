"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { HeroPhone } from "@/lib/config/hero-page";
import { SITE_HERO_BANNER, STORE_SHELL } from "@/lib/config/site-config";
import { HERO_BANNER_AUTO_ADVANCE_MS } from "@/lib/constants/ui-timeouts";
const SWIPE_MIN_PX = 48;
/** Horizontal swipe must dominate vertical movement (avoid hijacking page scroll). */
const SWIPE_DOMINANCE = 1.25;

const heroCardBg = "bg-[#f3f3f3]";

type TouchStart = { x: number; y: number };

const reduceMotionQuery = "(prefers-reduced-motion: reduce)";

const subscribeReducedMotion = (onChange: () => void) => {
  const mq = window.matchMedia(reduceMotionQuery);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

const getReducedMotionSnapshot = () =>
  window.matchMedia(reduceMotionQuery).matches;

const getReducedMotionServerSnapshot = () => false;

type HeroBannerProps = {
  phones: ReadonlyArray<HeroPhone>;
};

export const HeroBanner = ({ phones }: HeroBannerProps) => {
  const count = phones.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
  const touchStartRef = useRef<TouchStart | null>(null);

  const goTo = useCallback(
    (i: number) => {
      if (count <= 0) return;
      setIndex(((i % count) + count) % count);
    },
    [count],
  );

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % count);
  }, [count]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    if (count <= 1 || paused) return undefined;
    const id = window.setInterval(goNext, HERO_BANNER_AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [count, paused, goNext]);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (count <= 1) return;
      const t = e.targetTouches[0];
      touchStartRef.current = { x: t.clientX, y: t.clientY };
    },
    [count],
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start || count <= 1) return;

      const t = e.changedTouches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;

      if (Math.abs(dx) < SWIPE_MIN_PX) return;
      if (Math.abs(dx) < Math.abs(dy) * SWIPE_DOMINANCE) return;

      if (dx < 0) goNext();
      else goPrev();
    },
    [count, goNext, goPrev],
  );

  const fadeClass = reduceMotion
    ? ""
    : "transition-opacity duration-700 ease-out";

  if (phones.length === 0) return null;

  return (
    <section
      className="border-b border-neutral-200 bg-white"
      aria-label={SITE_HERO_BANNER.sectionAriaLabel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className={`relative pb-5 pt-3 sm:pb-6 sm:pt-4 md:pb-6 md:pt-4 ${STORE_SHELL}`}
      >
        <div
          className="relative h-[min(32rem,82dvh)] min-h-[26rem] w-full touch-pan-y sm:h-[min(34rem,80dvh)] md:h-[26rem] lg:h-[28rem]"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {phones.map((phone, i) => {
            const isActive = i === index;
            const cardContent: ReactNode = (
              <div
                className={`flex h-full min-h-0 w-full max-w-full min-w-0 flex-col overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5 transition-shadow md:flex-row md:rounded-2xl ${heroCardBg} ${
                  phone.href ? "group-hover:shadow-md" : ""
                }`}
              >
                <div className="flex w-full min-w-0 shrink-0 flex-col justify-center px-5 py-5 sm:px-6 sm:py-6 md:w-[35%] md:border-r md:border-neutral-300/50 md:py-8 md:pl-7 md:pr-5 lg:pl-8 lg:pr-6">
                  <h2 className="text-2xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-[1.65rem] md:text-2xl lg:text-[1.75rem]">
                    {phone.name}
                  </h2>
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-snug text-neutral-700 marker:text-[var(--store-brand-primary)] sm:mt-4 sm:text-[0.9375rem] md:mt-5 md:space-y-2">
                    {phone.specs.map((line, specIndex) => (
                      <li key={`${phone.id}-spec-${specIndex}`}>{line}</li>
                    ))}
                  </ul>
                </div>

                <div className="relative min-h-0 w-full min-w-0 flex-1 basis-0 md:h-full md:w-[65%] md:flex-none">
                  <Image
                    src={phone.imageSrc}
                    alt={phone.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 65vw"
                    className="object-contain object-center p-3 sm:p-4 md:p-6 lg:p-7"
                    priority={i === 0}
                  />
                </div>
              </div>
            );

            return (
              <div
                key={phone.id}
                className={`absolute inset-0 flex h-full w-full items-stretch justify-center ${fadeClass} ${
                  isActive
                    ? "z-[1] opacity-100"
                    : "pointer-events-none z-0 opacity-0"
                }`}
                aria-hidden={!isActive}
              >
                {phone.href ? (
                  <Link
                    href={phone.href}
                    aria-label={`Shop ${phone.name}`}
                    tabIndex={isActive ? 0 : -1}
                    className="group block h-full w-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--store-brand-primary)] focus-visible:ring-offset-2"
                  >
                    {cardContent}
                  </Link>
                ) : (
                  cardContent
                )}
              </div>
            );
          })}
        </div>

        {count > 1 ? (
          <nav
            className="mt-3 flex justify-center md:mt-4"
            aria-label={SITE_HERO_BANNER.dotsNavAriaLabel}
          >
            <div className="inline-flex items-center gap-2.5 rounded-full bg-[var(--store-brand-primary)] px-4 py-2.5 shadow-sm sm:gap-3 sm:px-5 sm:py-3">
              {phones.map((phone, i) => {
                const active = i === index;
                return (
                  <button
                    key={phone.id}
                    type="button"
                    aria-label={`Show ${phone.name}`}
                    aria-current={active ? "true" : undefined}
                    className={[
                      "h-2.5 w-2.5 shrink-0 rounded-full transition-[transform,background-color,box-shadow] duration-200",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                      active
                        ? "scale-110 bg-white shadow-[0_0_0_2px_rgb(255_255_255_/_0.35)]"
                        : "bg-white/40 hover:bg-white/65",
                    ].join(" ")}
                    onClick={() => goTo(i)}
                  />
                );
              })}
            </div>
          </nav>
        ) : null}
      </div>
    </section>
  );
};
