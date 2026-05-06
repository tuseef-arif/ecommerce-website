import { FormInputField } from "@/components/ui/form-input-field";
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
      <FormInputField
        id="product-search"
        label="Search"
        name="q"
        type="search"
        defaultValue={filters.q}
        placeholder="Name, brand, model..."
        autoComplete="off"
        inputClassName="peer h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 pb-1 pt-3 text-sm leading-5 text-neutral-900 outline-none ring-0 transition-colors placeholder:text-transparent focus:border-[var(--store-brand-primary)] focus:ring-0"
        labelClassName="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 bg-white px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500 transition-all duration-150 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[10px] peer-focus:text-[var(--store-brand-primary)] peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-neutral-600"
      />

      <SelectField
        label="Brand"
        name="brand"
        options={brandOptions}
        defaultValue={filters.brand}
        variant="floating"
        size="sm"
      />
      <SelectField
        label="Category"
        name="category"
        options={categoryOptions}
        defaultValue={filters.category}
        variant="floating"
        size="sm"
      />
      <SelectField
        label="Status"
        name="status"
        options={STATUS_OPTIONS}
        defaultValue={filters.status}
        variant="floating"
        size="sm"
      />

      <div className="flex h-10 items-stretch gap-2 self-end">
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
