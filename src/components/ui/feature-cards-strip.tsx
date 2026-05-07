import type { ComponentType, SVGProps } from "react";
import {
  IconFeedback,
  IconMoney,
  IconPackage,
  IconRefreshCcw,
} from "@/components/icons";
import { STORE_SHELL } from "@/lib/config/site-config";

type FeatureCardIcon = ComponentType<SVGProps<SVGSVGElement>>;

type FeatureCardItem = {
  title: string;
  subtitle: string;
  Icon: FeatureCardIcon;
};

const FEATURE_CARDS: FeatureCardItem[] = [
  {
    title: "Express Delivery",
    subtitle: "All Over Lahore",
    Icon: IconPackage,
  },
  {
    title: "Positive Feedback",
    subtitle: "99% Customer Satisfaction Rate",
    Icon: IconFeedback,
  },
  {
    title: "Easy Return & Refunds",
    subtitle: "T&Cs Apply",
    Icon: IconRefreshCcw,
  },
  {
    title: "Cost Saving",
    subtitle: "Excellent Price & Sales",
    Icon: IconMoney,
  },
];

const FeatureCard = ({ title, subtitle, Icon }: FeatureCardItem) => (
  <article className="flex min-h-32 flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-6 text-center">
    <Icon
      className="mb-3 text-[var(--store-brand-primary)]"
      width={28}
      height={28}
    />
    <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
    <p className="mt-1 text-sm text-neutral-600">{subtitle}</p>
  </article>
);

export const FeatureCardsStrip = () => (
  <section
    className={`w-full py-8 ${STORE_SHELL}`}
    aria-label="Store highlights"
  >
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {FEATURE_CARDS.map((card) => (
        <FeatureCard key={card.title} {...card} />
      ))}
    </div>
  </section>
);
