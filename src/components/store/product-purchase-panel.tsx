"use client";

import { useMemo, useState } from "react";
import { IconCheckCircleFilled } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  ADDED_BUTTON_CLASS,
  ADDED_LABEL,
  LIMIT_REACHED_LABEL,
  OUT_OF_STOCK_LABEL,
  useAddToCartFeedback,
} from "@/components/store/use-add-to-cart-feedback";
import { addItemToStoreCart } from "@/lib/cart/store-cart";
import {
  SITE_PRODUCT_DETAIL,
  SITE_PRODUCT_SLIDER,
} from "@/lib/config/site-config";
import {
  formatProductPriceAmount,
  formatProductPriceWithPrefix,
} from "@/lib/products/format-price";
import type { ProductVariantOption } from "@/lib/products/specs";

type ProductPurchasePanelProps = {
  productId: string;
  productHref: string;
  productImagePath: string | null;
  /** Product name — used in CTA aria-labels for screen readers. */
  productName: string;
  /** Original (pre-discount) base price in store currency units. */
  basePrice: number;
  /**
   * Effective base price after any store-level discount. Equal to
   * `basePrice` when no discount is active. Variant deltas are added on top
   * of this value (deltas themselves are never discounted).
   */
  finalBasePrice: number;
  /** Pre-formatted discount badge label, or `null` when no discount runs. */
  discountLabel: string | null;
  /** Whether stock is positive — flips the CTA into a disabled state. */
  isInStock: boolean;
  /** Current inventory count; used to cap cart additions. */
  stock: number;
  colorOptions: ReadonlyArray<ProductVariantOption>;
  storageOptions: ReadonlyArray<ProductVariantOption>;
};

const buildOptionLabel = (
  option: ProductVariantOption,
  pricePrefix: string,
): string => {
  if (option.priceDelta <= 0) return option.value;
  const suffix = `(${SITE_PRODUCT_DETAIL.variantOptionDeltaPrefix}${pricePrefix} ${formatProductPriceAmount(
    option.priceDelta,
  )})`;
  return `${option.value} ${suffix}`;
};

const findDelta = (
  options: ReadonlyArray<ProductVariantOption>,
  value: string,
): number => {
  const match = options.find((option) => option.value === value);
  return match ? match.priceDelta : 0;
};

/**
 * Client island that owns the shopper's variant selection and renders the
 * three coupled UI pieces — live price, color/storage dropdowns, and the
 * Add-to-Cart / Compare CTAs — in lockstep. Lifted into its own component so
 * the rest of `ProductDetail` stays server-rendered for SEO and faster TTFB.
 *
 * Pricing rule: the discount (if any) applies to the base price only;
 * variant `priceDelta` values are added on top of the discounted total. This
 * matches the "+Rs 500 for white" sticker-style pricing shoppers expect on
 * mobile shop fronts and avoids surprising "your discount got smaller" UX
 * when picking a more expensive variant.
 *
 * Falls back gracefully when the admin hasn't entered any options: the
 * relevant dropdown simply isn't rendered.
 */
export const ProductPurchasePanel = ({
  productId,
  productHref,
  productImagePath,
  productName,
  basePrice,
  finalBasePrice,
  discountLabel,
  isInStock,
  stock,
  colorOptions,
  storageOptions,
}: ProductPurchasePanelProps) => {
  const pricePrefix = SITE_PRODUCT_SLIDER.pricePrefix;

  const hasColors = colorOptions.length > 0;
  const hasStorages = storageOptions.length > 0;

  const colorSelectOptions = useMemo(
    () =>
      colorOptions.map((option) => ({
        value: option.value,
        label: buildOptionLabel(option, pricePrefix),
      })),
    [colorOptions, pricePrefix],
  );
  const storageSelectOptions = useMemo(
    () =>
      storageOptions.map((option) => ({
        value: option.value,
        label: buildOptionLabel(option, pricePrefix),
      })),
    [storageOptions, pricePrefix],
  );

  const [selectedColor, setSelectedColor] = useState<string>(
    () => colorOptions[0]?.value ?? "",
  );
  const [selectedStorage, setSelectedStorage] = useState<string>(
    () => storageOptions[0]?.value ?? "",
  );
  const { status, isAdded, showAdded, showLimitReached, showOutOfStock } =
    useAddToCartFeedback();
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);

  const colorDelta = findDelta(colorOptions, selectedColor);
  const storageDelta = findDelta(storageOptions, selectedStorage);
  const totalDelta = colorDelta + storageDelta;

  const displayFinalPrice = finalBasePrice + totalDelta;
  const displayOriginalPrice = basePrice + totalDelta;
  const hasDiscount = displayFinalPrice < displayOriginalPrice;

  const originalPriceLabel = formatProductPriceWithPrefix(
    displayOriginalPrice,
    pricePrefix,
  );
  const finalPriceAmount = formatProductPriceAmount(displayFinalPrice);
  const maxQuantityPerAdd = Math.max(1, Math.min(10, stock));
  const quantityOptions = useMemo(
    () =>
      Array.from({ length: maxQuantityPerAdd }, (_, index) => {
        const value = String(index + 1);
        return { value, label: value };
      }),
    [maxQuantityPerAdd],
  );
  const addToCartCtaLabel = !isInStock
    ? SITE_PRODUCT_DETAIL.addToCartDisabledLabel
    : status === "out_of_stock"
      ? OUT_OF_STOCK_LABEL
      : status === "limit_reached"
        ? LIMIT_REACHED_LABEL
        : isAdded
          ? ADDED_LABEL
          : SITE_PRODUCT_DETAIL.addToCartLabel;

  const variantFieldCount = (hasColors ? 1 : 0) + (hasStorages ? 1 : 0) + 1;
  const variantsLayoutClass =
    variantFieldCount >= 3
      ? "grid w-full grid-cols-3 gap-2 sm:max-w-xl sm:gap-4"
      : variantFieldCount === 2
        ? "grid w-full grid-cols-2 gap-2 sm:max-w-xl sm:gap-4"
        : "grid w-full grid-cols-1 gap-2 sm:max-w-[7rem]";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="flex items-baseline gap-1.5">
          <span className="text-base font-semibold text-neutral-700 sm:text-lg">
            {pricePrefix}
          </span>
          <span className="text-3xl font-bold text-neutral-900 tabular-nums sm:text-4xl">
            {finalPriceAmount}
          </span>
        </span>
        {hasDiscount ? (
          <span className="text-sm text-neutral-400 line-through tabular-nums sm:text-base">
            {originalPriceLabel}
          </span>
        ) : null}
        {discountLabel ? (
          <StatusBadge
            tone="success"
            className="px-2.5 py-1 text-[11px] uppercase tracking-wide"
          >
            {discountLabel}
          </StatusBadge>
        ) : null}
      </div>

      <section aria-label="Product options" className={variantsLayoutClass}>
        {hasColors ? (
          <SelectField
            name="color"
            label={SITE_PRODUCT_DETAIL.colorSelectLabel}
            variant="floating"
            options={colorSelectOptions}
            value={selectedColor}
            onChange={(event) => setSelectedColor(event.currentTarget.value)}
            wrapperClassName="w-full"
          />
        ) : null}

        {hasStorages ? (
          <SelectField
            name="storage"
            label={SITE_PRODUCT_DETAIL.storageOptionsHeading}
            variant="floating"
            options={storageSelectOptions}
            value={selectedStorage}
            onChange={(event) => setSelectedStorage(event.currentTarget.value)}
            wrapperClassName="w-full"
          />
        ) : null}

        <SelectField
          name="quantity"
          label="Quantity"
          variant="floating"
          options={quantityOptions}
          value={String(selectedQuantity)}
          onChange={(event) =>
            setSelectedQuantity(Math.max(1, Number(event.currentTarget.value)))
          }
          wrapperClassName="w-full"
        />
      </section>

      <div className="grid w-full grid-cols-2 gap-2 pt-1 sm:max-w-xl sm:gap-3">
        <Button
          type="button"
          variant="primary"
          size="md"
          disabled={!isInStock}
          aria-label={`${addToCartCtaLabel}: ${productName}`}
          className={`w-full rounded-md transition-all duration-200 ${isAdded ? ADDED_BUTTON_CLASS : ""}`}
          onClick={() => {
            if (!isInStock) return;
            const result = addItemToStoreCart(
              {
                productId,
                name: productName,
                href: productHref,
                imagePath: productImagePath,
                unitPrice: displayFinalPrice,
                selectedColor: hasColors ? selectedColor || null : null,
                selectedStorage: hasStorages ? selectedStorage || null : null,
              },
              selectedQuantity,
              { maxPerUser: 10, stockAvailable: stock },
            );
            if (result.ok && result.addedQuantity > 0) {
              showAdded();
              return;
            }
            if (!result.ok && result.reason === "out_of_stock") {
              showOutOfStock();
              return;
            }
            showLimitReached();
          }}
        >
          {isAdded && isInStock ? (
            <IconCheckCircleFilled
              width={16}
              height={16}
              className="text-white"
            />
          ) : null}
          {addToCartCtaLabel}
        </Button>
        <Button
          type="button"
          variant="accent"
          size="md"
          aria-label={`${SITE_PRODUCT_DETAIL.compareAriaLabel}: ${productName}`}
          className="w-full rounded-md"
        >
          {SITE_PRODUCT_DETAIL.compareLabel}
        </Button>
      </div>
    </div>
  );
};
