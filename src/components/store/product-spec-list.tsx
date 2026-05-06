import type { ProductSpecEntry } from "@/lib/products/specs";

type ProductSpecListProps = {
  specs: ReadonlyArray<ProductSpecEntry>;
  /** Heading rendered above the list. */
  heading: string;
  /** Copy shown when there are no spec rows. */
  emptyLabel: string;
  /** Optional id for `aria-labelledby` linkage. */
  headingId?: string;
};

/**
 * Two-column key/value table used on the product detail page.
 * Pure presentational component — accepts already-parsed spec entries so
 * it can be reused by any screen that surfaces spec data.
 */
export const ProductSpecList = ({
  specs,
  heading,
  emptyLabel,
  headingId,
}: ProductSpecListProps) => (
  <section
    aria-labelledby={headingId}
    className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6"
  >
    <h2
      id={headingId}
      className="text-lg font-semibold text-neutral-900 sm:text-xl"
    >
      {heading}
    </h2>

    {specs.length === 0 ? (
      <p className="mt-3 text-sm text-neutral-500">{emptyLabel}</p>
    ) : (
      <dl className="mt-4 divide-y divide-neutral-100 text-sm">
        {specs.map(({ key, value }) => (
          <div
            key={key}
            className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[minmax(8rem,16rem)_1fr] sm:gap-4"
          >
            <dt className="font-medium text-neutral-600">{key}</dt>
            <dd className="text-neutral-900">{value || "—"}</dd>
          </div>
        ))}
      </dl>
    )}
  </section>
);
