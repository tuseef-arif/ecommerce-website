"use client";

import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type {
  SalesChartRangeDays,
  SalesDayPoint,
} from "@/lib/dashboard/sales-chart-shared";
import { formatStoreCalendarDayKeyShort } from "@/lib/datetime/display-timezone";

type DashboardSalesAnalyticsProps = {
  points: readonly SalesDayPoint[];
  currencyPrefix: string;
  rangeDays: SalesChartRangeDays;
};

type Coord = { x: number; y: number; day: string; revenue: number };

const compactMoney = (n: number, prefix: string): string => {
  if (!Number.isFinite(n)) return `${prefix} 0`;
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${prefix} ${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${prefix} ${(n / 1_000).toFixed(1)}k`;
  return `${prefix} ${n.toFixed(0)}`;
};

const formatFullMoney = (n: number, prefix: string): string => {
  const safe = Number.isFinite(n) ? n : 0;
  return `${prefix} ${safe.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const shortDayLabel = (isoDay: string): string =>
  formatStoreCalendarDayKeyShort(isoDay);

/** Smooth Catmull-Rom style curve through points (open path). */
const smoothLinePath = (pts: Coord[]): string => {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const i0 = Math.max(0, i - 1);
    const i1 = i;
    const i2 = i + 1;
    const i3 = Math.min(pts.length - 1, i + 2);
    const p0 = pts[i0];
    const p1 = pts[i1];
    const p2 = pts[i2];
    const p3 = pts[i3];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
};

const areaPathFromLine = (
  lineD: string,
  bottomY: number,
  lastX: number,
  firstX: number,
): string => {
  if (!lineD) return "";
  return `${lineD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
};

export const DashboardSalesAnalytics = ({
  points,
  currencyPrefix,
  rangeDays,
}: DashboardSalesAnalyticsProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const w = 400;
  const h = 236;
  const padL = 54;
  const padR = 12;
  const padT = 20;
  const padB = 40;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const bottomY = padT + innerH;

  const revenues = points.map((p) => p.revenue);
  const maxR = Math.max(0, ...revenues);
  const yMax = maxR <= 0 ? 1 : maxR * 1.1;

  const coords: Coord[] = useMemo(() => {
    const span = Math.max(1, points.length - 1);
    return points.map((p, i) => ({
      x: padL + (innerW * i) / span,
      y: padT + innerH * (1 - p.revenue / yMax),
      day: p.day,
      revenue: p.revenue,
    }));
  }, [points, padL, padT, innerW, innerH, yMax]);

  const lineD = useMemo(() => smoothLinePath(coords), [coords]);
  const areaD = useMemo(() => {
    if (coords.length === 0) return "";
    return areaPathFromLine(
      lineD,
      bottomY,
      coords[coords.length - 1].x,
      coords[0].x,
    );
  }, [lineD, coords, bottomY]);

  const lineRef = useRef<SVGPathElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [pathLen, setPathLen] = useState(0);
  const [drawLine, setDrawLine] = useState(false);
  const [hover, setHover] = useState<{
    index: number;
    anchorX: number;
    anchorY: number;
  } | null>(null);

  useLayoutEffect(() => {
    const el = lineRef.current;
    if (!el || !lineD) return;
    const len = el.getTotalLength();
    const id = requestAnimationFrame(() => {
      setPathLen(0);
      setDrawLine(false);
      requestAnimationFrame(() => {
        setPathLen(len);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => setDrawLine(true)),
        );
      });
    });
    return () => cancelAnimationFrame(id);
  }, [lineD, rangeDays]);

  const yTicks = 4;
  const tickVals = useMemo(
    () => Array.from({ length: yTicks + 1 }, (_, i) => (yMax * i) / yTicks),
    [yMax, yTicks],
  );

  const xLabelIndices = useMemo(() => {
    if (points.length <= 7) return points.map((_, i) => i);
    const out = new Set<number>([0, points.length - 1]);
    const step = Math.max(1, Math.ceil(points.length / 6));
    for (let i = step; i < points.length - 1; i += step) out.add(i);
    return [...out].sort((a, b) => a - b);
  }, [points]);

  const reactId = useId().replace(/:/g, "");
  const gradId = `${reactId}-line`;
  const areaGradId = `${reactId}-area`;

  const handleRangeChange = (next: SalesChartRangeDays) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 7) params.delete("sales");
    else params.set("sales", "30");
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };

  const chartAriaLabel =
    "Daily order revenue by Pakistan (Asia/Karachi) calendar day; hover for amount.";

  const handleSvgPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg || coords.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * w;
    const y = ((e.clientY - rect.top) / rect.height) * h;
    const p = { x, y };
    if (p.x < padL - 8 || p.x > w - padR + 8 || p.y < padT - 8 || p.y > h) {
      setHover(null);
      return;
    }
    let nearest = 0;
    let best = Infinity;
    for (let i = 0; i < coords.length; i++) {
      const dist = Math.abs(coords[i].x - p.x);
      if (dist < best) {
        best = dist;
        nearest = i;
      }
    }
    const scaleX = rect.width / w;
    const scaleY = rect.height / h;
    const anchorX = rect.left + coords[nearest].x * scaleX;
    const anchorY = rect.top + coords[nearest].y * scaleY;
    setHover({ index: nearest, anchorX, anchorY });
  };

  const clearHover = () => setHover(null);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-neutral-900">Sales analytics</h2>
        <label className="sr-only" htmlFor="dashboard-sales-range">
          Revenue period
        </label>
        <select
          id="dashboard-sales-range"
          value={rangeDays}
          onChange={(e) => handleRangeChange(e.target.value === "30" ? 30 : 7)}
          className="cursor-pointer rounded-xl border border-neutral-200 bg-white/90 px-3 py-2 text-sm font-medium text-neutral-800 shadow-sm backdrop-blur-sm transition hover:border-neutral-300 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      <div className="relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden rounded-2xl border border-neutral-200/90 bg-gradient-to-br from-slate-50/95 via-white to-[rgb(42_75_160_/_0.06)] p-4 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.8)]">
        {hover ? (
          <div
            className="pointer-events-none fixed z-[100] rounded-lg bg-neutral-900 px-3 py-2 text-left text-xs text-white shadow-lg ring-1 ring-white/10"
            style={{
              left: hover.anchorX,
              top: hover.anchorY,
              transform: "translate(-50%, calc(-100% - 10px))",
            }}
            role="status"
          >
            <p className="font-semibold text-white">
              {shortDayLabel(coords[hover.index].day)}
            </p>
            <p className="mt-0.5 tabular-nums text-neutral-200">
              {formatFullMoney(coords[hover.index].revenue, currencyPrefix)}
            </p>
          </div>
        ) : null}

        <svg
          ref={svgRef}
          viewBox={`0 0 ${w} ${h}`}
          className="h-56 w-full max-w-full shrink-0 cursor-crosshair touch-none"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={chartAriaLabel}
          onPointerMove={handleSvgPointer}
          onPointerLeave={clearHover}
          onPointerCancel={clearHover}
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(37 99 235)" />
              <stop offset="55%" stopColor="rgb(42 75 160)" />
              <stop offset="100%" stopColor="rgb(254 153 34)" />
            </linearGradient>
            <linearGradient id={areaGradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(42 75 160 / 0.35)" />
              <stop offset="100%" stopColor="rgb(42 75 160 / 0.02)" />
            </linearGradient>
          </defs>

          {tickVals.map((tv, i) => {
            const y = padT + innerH * (1 - tv / yMax);
            return (
              <g key={`grid-${i}`}>
                <line
                  x1={padL}
                  x2={w - padR}
                  y1={y}
                  y2={y}
                  stroke="rgb(226 232 240)"
                  strokeWidth={1}
                />
                <text
                  x={padL - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-neutral-500"
                  style={{ fontSize: 10, fontWeight: 500 }}
                >
                  {compactMoney(tv, currencyPrefix)}
                </text>
              </g>
            );
          })}

          {areaD ? (
            <path
              d={areaD}
              fill={`url(#${areaGradId})`}
              stroke="none"
              className="transition-opacity duration-700 ease-out"
              style={{ opacity: drawLine ? 1 : 0, transitionDelay: "280ms" }}
            />
          ) : null}

          {lineD ? (
            <path
              ref={lineRef}
              d={lineD}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={pathLen > 0 ? pathLen : undefined}
              strokeDashoffset={
                pathLen > 0 ? (drawLine ? 0 : pathLen) : undefined
              }
              style={{
                opacity: pathLen > 0 ? 1 : 0,
                transition:
                  "stroke-dashoffset 1.15s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            />
          ) : null}

          <g
            className="transition-opacity duration-500 ease-out"
            style={{ opacity: drawLine ? 1 : 0, transitionDelay: "520ms" }}
          >
            {coords.map((c, i) => {
              const isHover = hover?.index === i;
              return (
                <circle
                  key={c.day}
                  cx={c.x}
                  cy={c.y}
                  r={isHover ? 5.5 : 4}
                  fill="white"
                  stroke={`url(#${gradId})`}
                  strokeWidth={isHover ? 2.5 : 2}
                  className="transition-[r,stroke-width] duration-150"
                />
              );
            })}
          </g>

          {xLabelIndices.map((idx) => {
            const c = coords[idx];
            if (!c) return null;
            return (
              <text
                key={`x-${c.day}`}
                x={c.x}
                y={h - 12}
                textAnchor="middle"
                className="fill-neutral-500"
                style={{ fontSize: 10, fontWeight: 500 }}
              >
                {shortDayLabel(c.day)}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
