"use client";

import { useEffect, useState } from "react";

const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;

const DURATION_MS = 1_100;

type AnimatedNumberProps = {
  target: number;
  decimals: 0 | 2;
  currencyPrefix?: string;
};

const AnimatedMetricValue = ({
  target,
  decimals,
  currencyPrefix,
}: AnimatedNumberProps) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let start: number | null = null;
    let frameId = 0;
    const safeTarget = Number.isFinite(target) ? target : 0;

    const tick = (now: number) => {
      if (cancelled) return;
      if (start === null) start = now;
      const elapsed = now - start;
      const rawT = Math.min(elapsed / DURATION_MS, 1);
      const t = easeOutCubic(rawT);
      const next = safeTarget * t;

      if (decimals === 0) {
        setValue(rawT >= 1 ? safeTarget : Math.round(next));
      } else {
        setValue(rawT >= 1 ? safeTarget : next);
      }

      if (rawT < 1) frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(() => {
      if (cancelled) return;
      setValue(0);
      frameId = requestAnimationFrame(tick);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
    };
  }, [target, decimals]);

  if (decimals === 2) {
    const prefix = currencyPrefix ?? "";
    const formatted = value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return (
      <span className="tabular-nums">
        {prefix} {formatted}
      </span>
    );
  }

  return <span className="tabular-nums">{Math.round(value)}</span>;
};

export type DashboardMetricCardsProps = {
  currencyPrefix: string;
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  pendingDelivery: number;
};

export const DashboardMetricCards = ({
  currencyPrefix,
  totalRevenue,
  totalOrders,
  totalCustomers,
  pendingDelivery,
}: DashboardMetricCardsProps) => {
  const cards = [
    {
      label: "Total Revenue",
      target: totalRevenue,
      decimals: 2 as const,
    },
    {
      label: "Total Orders",
      target: totalOrders,
      decimals: 0 as const,
    },
    {
      label: "Total Customers",
      target: totalCustomers,
      decimals: 0 as const,
    },
    {
      label: "Pending Delivery",
      target: pendingDelivery,
      decimals: 0 as const,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.label}
          className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
        >
          <p className="text-sm text-neutral-500">{card.label}</p>
          <p className="mt-3 flex min-h-[3.25rem] items-center justify-center text-center text-3xl font-bold text-neutral-900">
            <AnimatedMetricValue
              target={card.target}
              decimals={card.decimals}
              currencyPrefix={card.decimals === 2 ? currencyPrefix : undefined}
            />
          </p>
        </article>
      ))}
    </div>
  );
};
