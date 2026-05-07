"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { SelectField } from "@/components/ui/select-field";

type StorefrontProductsSort = "latest" | "price-desc" | "price-asc";

type ProductsListingFiltersProps = {
  categoryOptions?: ReadonlyArray<{ id: string; slug: string; name: string }>;
  selectedCategory: string;
  brandOptions: ReadonlyArray<string>;
  selectedBrand: string;
  selectedMinPrice: number | null;
  selectedMaxPrice: number | null;
  selectedSort: StorefrontProductsSort;
  className?: string;
  labels: {
    category: string;
    allCategories: string;
    brand: string;
    allBrands: string;
    sortBy: string;
    sortLatest: string;
    sortPriceHighToLow: string;
    sortPriceLowToHigh: string;
  };
};

const formatBrandDisplay = (raw: string): string => {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return "";
  return trimmed
    .split(/\s+/)
    .map((part) =>
      part.length === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(" ");
};

export const ProductsListingFilters = ({
  categoryOptions,
  selectedCategory,
  brandOptions,
  selectedBrand,
  selectedMinPrice,
  selectedMaxPrice,
  selectedSort,
  className = "",
  labels,
}: ProductsListingFiltersProps) => {
  const router = useRouter();

  const updateUrl = (
    nextCategory: string,
    nextBrand: string,
    nextSort: StorefrontProductsSort,
  ) => {
    const params = new URLSearchParams();
    if (nextCategory.length > 0) params.set("category", nextCategory);
    if (nextBrand.length > 0) params.set("brand", nextBrand);
    if (nextSort !== "latest") params.set("sort", nextSort);
    if (selectedMinPrice !== null) {
      params.set("minPrice", String(selectedMinPrice));
    }
    if (selectedMaxPrice !== null) {
      params.set("maxPrice", String(selectedMaxPrice));
    }
    const query = params.toString();
    router.push(query.length > 0 ? `/products?${query}` : "/products");
  };

  const categorySelectOptions = useMemo(
    () =>
      categoryOptions
        ? [
            { value: "", label: labels.allCategories },
            ...categoryOptions.map((category) => ({
              value: category.slug,
              label: category.name,
            })),
          ]
        : [],
    [categoryOptions, labels.allCategories],
  );

  const brandSelectOptions = useMemo(
    () => [
      { value: "", label: labels.allBrands },
      ...brandOptions.map((brand) => ({
        value: brand,
        label: formatBrandDisplay(brand),
      })),
    ],
    [brandOptions, labels.allBrands],
  );

  const sortSelectOptions = useMemo(
    () => [
      { value: "latest", label: labels.sortLatest },
      { value: "price-desc", label: labels.sortPriceHighToLow },
      { value: "price-asc", label: labels.sortPriceLowToHigh },
    ],
    [labels.sortLatest, labels.sortPriceHighToLow, labels.sortPriceLowToHigh],
  );

  return (
    <div className={`flex items-center gap-1.5 sm:gap-3 ${className}`.trim()}>
      {categoryOptions ? (
        <SelectField
          label={labels.category}
          name="category"
          variant="floating"
          size="sm"
          options={categorySelectOptions}
          value={selectedCategory}
          onChange={(event) =>
            updateUrl(event.currentTarget.value, "", "latest")
          }
          wrapperClassName="min-w-0 flex-1"
        />
      ) : null}

      <SelectField
        label={labels.brand}
        name="brand"
        variant="floating"
        size="sm"
        options={brandSelectOptions}
        value={selectedBrand}
        onChange={(event) =>
          updateUrl(selectedCategory, event.currentTarget.value, selectedSort)
        }
        wrapperClassName="min-w-0 flex-1"
      />

      <SelectField
        label={labels.sortBy}
        name="sort"
        variant="floating"
        size="sm"
        options={sortSelectOptions}
        value={selectedSort}
        onChange={(event) =>
          updateUrl(
            selectedCategory,
            selectedBrand,
            event.currentTarget.value as StorefrontProductsSort,
          )
        }
        wrapperClassName="min-w-0 flex-1"
      />
    </div>
  );
};
