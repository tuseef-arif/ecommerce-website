import { SelectField } from "@/components/ui/select-field";
import type {
  AdminProductCategoryOption,
  AdminProductsListFilters,
} from "@/lib/products/admin-types";

type ProductFiltersProps = {
  filters: AdminProductsListFilters;
  brands: ReadonlyArray<string>;
  categories: ReadonlyArray<AdminProductCategoryOption>;
};

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

/**
 * Server-rendered filter bar that submits via plain GET so the URL captures
 * search/filter state (shareable, refresh-safe). No client JS required.
 */
export const ProductFilters = ({
  filters,
  brands,
  categories,
}: ProductFiltersProps) => {
  const brandOptions = [
    { value: "", label: "All brands" },
    ...brands.map((brand) => ({ value: brand, label: brand })),
  ];
  const categoryOptions = [
    { value: "", label: "All categories" },
    ...categories.map((category) => ({
      value: category.slug,
      label: category.name,
    })),
  ];

  return (
    <form
      method="get"
      action="/dashboard/products"
      className="grid gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]"
    >
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="product-search"
          className="text-xs font-semibold uppercase tracking-wide text-neutral-600"
        >
          Search
        </label>
        <input
          id="product-search"
          name="q"
          type="search"
          defaultValue={filters.q}
          placeholder="Name, brand, model…"
          className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-[var(--store-brand-primary)]"
          autoComplete="off"
        />
      </div>

      <SelectField
        label="Brand"
        name="brand"
        options={brandOptions}
        defaultValue={filters.brand}
      />
      <SelectField
        label="Category"
        name="category"
        options={categoryOptions}
        defaultValue={filters.category}
      />
      <SelectField
        label="Status"
        name="status"
        options={STATUS_OPTIONS}
        defaultValue={filters.status}
      />

      <div className="flex items-end gap-2">
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--store-brand-primary)] px-4 text-sm font-semibold text-white shadow-sm transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
        >
          Apply
        </button>
        <a
          href="/dashboard/products"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          Reset
        </a>
      </div>
    </form>
  );
};
