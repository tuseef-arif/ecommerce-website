"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
} from "react";
import { searchProductsForBannerAction } from "@/app/(admin)/dashboard/banner/actions";
import { Button } from "@/components/ui/button";
import { HERO_SLIDE_LINKED_PRODUCT_MAX } from "@/lib/hero/admin-schemas";
import type { AdminHeroLinkedProduct } from "@/lib/hero/admin-types";
import { safeProductImageSrc } from "@/lib/products/safe-image-src";

type HeroLinkedProductsPickerProps = {
  /** Hidden input name read by the server action. */
  fieldName?: string;
  /** Existing linked products when editing. */
  initialSelected?: ReadonlyArray<AdminHeroLinkedProduct>;
  /** Validation error from the server action, if any. */
  errorMessage?: string | null;
  /** Inclusive cap on selections. Mirrors the server limit. */
  maxCount?: number;
};

const SEARCH_DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

const formatChipBrand = (brand: string): string => brand.trim();

export const HeroLinkedProductsPicker = ({
  fieldName = "linkedProductIdsJson",
  initialSelected = [],
  errorMessage,
  maxCount = HERO_SLIDE_LINKED_PRODUCT_MAX,
}: HeroLinkedProductsPickerProps) => {
  const groupId = useId();
  const inputId = useId();
  const listboxId = useId();

  const [selected, setSelected] = useState<AdminHeroLinkedProduct[]>(() => [
    ...initialSelected,
  ]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminHeroLinkedProduct[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const wrapperRef = useRef<HTMLFieldSetElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selectedIds = useMemo(() => selected.map((p) => p.id), [selected]);
  const serialized = useMemo(() => JSON.stringify(selectedIds), [selectedIds]);
  const isAtMax = selected.length >= maxCount;

  // Close the dropdown when the user clicks outside the picker shell.
  useEffect(() => {
    if (!isOpen) return;
    const handler = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // Debounced typeahead. Re-runs when the query or selection changes (the
  // server filters out already-selected ids so they stop appearing). State
  // is only mutated inside the async transition so we avoid the "setState
  // synchronously in an effect" antipattern — clearing for short queries is
  // handled directly in the input's `onChange`.
  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < MIN_QUERY_LENGTH || isAtMax) return;

    const handle = setTimeout(() => {
      startTransition(async () => {
        try {
          const found = await searchProductsForBannerAction({
            query: trimmedQuery,
            excludeIds: selectedIds,
          });
          setResults(found);
          setSearchError(null);
        } catch (error) {
          console.error("Hero picker search failed", error);
          setSearchError("Search failed. Try again.");
          setResults([]);
        }
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [query, selectedIds, isAtMax]);

  const handleAdd = useCallback(
    (product: AdminHeroLinkedProduct) => {
      setSelected((prev) => {
        if (prev.length >= maxCount) return prev;
        if (prev.some((entry) => entry.id === product.id)) return prev;
        return [...prev, product];
      });
      setQuery("");
      setResults([]);
      setIsOpen(false);
      inputRef.current?.focus();
    },
    [maxCount],
  );

  const handleRemove = useCallback((productId: string) => {
    setSelected((prev) => prev.filter((entry) => entry.id !== productId));
  }, []);

  const handleMove = useCallback((index: number, direction: -1 | 1) => {
    setSelected((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return next;
    });
  }, []);

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      setIsOpen(false);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (results.length > 0 && !isAtMax) handleAdd(results[0]);
    }
  };

  const showDropdown =
    isOpen && !isAtMax && query.trim().length >= MIN_QUERY_LENGTH;

  return (
    <fieldset
      aria-labelledby={`${groupId}-label`}
      className="rounded-2xl border border-neutral-200 bg-white p-4"
      ref={wrapperRef}
    >
      <div className="flex flex-col gap-1">
        <legend
          id={`${groupId}-label`}
          className="text-xs font-semibold uppercase tracking-wide text-neutral-600"
        >
          Linked products
        </legend>
        <p className="text-xs text-neutral-500">
          Where the banner navigates on click. One product opens its detail
          page; two or more open a curated grid. Up to {maxCount} products.
        </p>
      </div>

      <input type="hidden" name={fieldName} value={serialized} />

      {selected.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {selected.map((product, index) => {
            const imageSrc = safeProductImageSrc(product.imagePath);
            const brand = formatChipBrand(product.brand);
            return (
              <li
                key={product.id}
                className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-2"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-white">
                  {imageSrc ? (
                    <Image
                      src={imageSrc}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-contain"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400">
                      No image
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900">
                    {product.name}
                  </p>
                  {brand ? (
                    <p className="truncate text-xs text-neutral-500">{brand}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMove(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${product.name} up`}
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMove(index, 1)}
                    disabled={index === selected.length - 1}
                    aria-label={`Move ${product.name} down`}
                  >
                    ↓
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(product.id)}
                    aria-label={`Remove ${product.name}`}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
          No products linked yet. The banner will render as non-clickable.
        </p>
      )}

      <div className="relative mt-3">
        <label htmlFor={inputId} className="sr-only">
          Search products to link
        </label>
        <input
          id={inputId}
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => {
            const next = event.target.value;
            setQuery(next);
            setIsOpen(true);
            if (next.trim().length < MIN_QUERY_LENGTH) {
              setResults([]);
              setSearchError(null);
            }
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleInputKeyDown}
          disabled={isAtMax}
          placeholder={
            isAtMax
              ? `Maximum of ${maxCount} products reached`
              : "Search products by name, brand, or model…"
          }
          role="combobox"
          aria-controls={listboxId}
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          autoComplete="off"
          className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-[var(--store-brand-primary)] disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500"
        />

        {showDropdown ? (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute left-0 right-0 top-full z-10 mt-1 max-h-72 overflow-auto rounded-lg border border-neutral-200 bg-white shadow-lg"
          >
            {isPending && results.length === 0 ? (
              <li className="px-3 py-2 text-xs text-neutral-500">Searching…</li>
            ) : null}

            {!isPending && results.length === 0 ? (
              <li className="px-3 py-2 text-xs text-neutral-500">
                No active products match “{query.trim()}”.
              </li>
            ) : null}

            {results.map((product) => {
              const imageSrc = safeProductImageSrc(product.imagePath);
              const brand = formatChipBrand(product.brand);
              return (
                <li key={product.id} role="option" aria-selected={false}>
                  <button
                    type="button"
                    onClick={() => handleAdd(product)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none"
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-white">
                      {imageSrc ? (
                        <Image
                          src={imageSrc}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-contain"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400">
                          No image
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-neutral-900">
                        {product.name}
                      </p>
                      {brand ? (
                        <p className="truncate text-xs text-neutral-500">
                          {brand}
                        </p>
                      ) : null}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      {searchError ? (
        <p
          role="alert"
          className="mt-3 rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700"
        >
          {searchError}
        </p>
      ) : null}

      {errorMessage ? (
        <p
          role="alert"
          className="mt-3 rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700"
        >
          {errorMessage}
        </p>
      ) : null}
    </fieldset>
  );
};
