import Link from "next/link";

type PriceRangeItem = {
  label: string;
  minPrice?: number;
  maxPrice?: number;
};

const PRICE_RANGES: ReadonlyArray<PriceRangeItem> = [
  { label: "Under Rs. 5,000", maxPrice: 5000 },
  { label: "Rs. 5,000 - Rs. 20,000", minPrice: 5000, maxPrice: 20000 },
  { label: "Rs. 20,000 - Rs. 30,000", minPrice: 20000, maxPrice: 30000 },
  { label: "Rs. 30,000 - Rs. 50,000", minPrice: 30000, maxPrice: 50000 },
  { label: "Rs. 50,000 - Rs. 75,000", minPrice: 50000, maxPrice: 75000 },
  { label: "Rs. 75,000 - Rs. 100,000", minPrice: 75000, maxPrice: 100000 },
  { label: "Rs. 100,000 - Rs. 200,000", minPrice: 100000, maxPrice: 200000 },
  { label: "Above Rs. 200,000", minPrice: 200000 },
];

const buildPriceRangeHref = (range: PriceRangeItem): string => {
  const params = new URLSearchParams();
  if (typeof range.minPrice === "number") {
    params.set("minPrice", String(range.minPrice));
  }
  if (typeof range.maxPrice === "number") {
    params.set("maxPrice", String(range.maxPrice));
  }
  return `/products?${params.toString()}`;
};

export const PriceRangePanel = () => (
  <section
    aria-label="Shop by price"
    className="rounded-2xl border border-neutral-200 bg-white px-3 py-5 sm:px-4 sm:py-6"
  >
    <h2 className="mb-4 text-center text-2xl font-semibold leading-tight text-[var(--store-brand-primary)] sm:mb-5 sm:text-3xl">
      Shop By Price - Find Your Perfect Deal
    </h2>
    <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
      {PRICE_RANGES.map((range) => (
        <Link
          key={range.label}
          href={buildPriceRangeHref(range)}
          className="inline-flex min-h-11 items-center justify-center rounded-none border border-[var(--store-brand-primary)]/70 px-2 py-2 text-center text-xs font-semibold text-[var(--store-brand-primary)] transition-colors hover:bg-[var(--store-brand-primary)]/5 sm:text-sm"
        >
          {range.label}
        </Link>
      ))}
    </div>
  </section>
);
