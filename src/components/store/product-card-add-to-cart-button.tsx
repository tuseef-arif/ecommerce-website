"use client";

import { useMemo, useState } from "react";
import { IconCart, IconCheckCircleFilled } from "@/components/icons";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import {
  ADDED_BUTTON_CLASS,
  ADDED_LABEL,
  LIMIT_REACHED_LABEL,
  useAddToCartFeedback,
} from "@/components/store/use-add-to-cart-feedback";
import {
  SITE_PRODUCT_DETAIL,
  SITE_PRODUCT_SLIDER,
} from "@/lib/config/site-config";
import { addItemToStoreCart } from "@/lib/cart/store-cart";
import { formatProductPriceAmount } from "@/lib/products/format-price";
import type { ProductVariantOption } from "@/lib/products/specs";

type ProductCardAddToCartButtonProps = {
  productId: string;
  productName: string;
  href: string;
  imagePath: string | null;
  unitPrice: number;
  stock: number;
  isInStock: boolean;
  colorOptions: ReadonlyArray<ProductVariantOption>;
  storageOptions: ReadonlyArray<ProductVariantOption>;
};

const optionLabel = (option: ProductVariantOption, pricePrefix: string) => {
  if (option.priceDelta <= 0) return option.value;
  return `${option.value} (+${pricePrefix} ${formatProductPriceAmount(option.priceDelta)})`;
};

export const ProductCardAddToCartButton = ({
  productId,
  productName,
  href,
  imagePath,
  unitPrice,
  stock,
  isInStock,
  colorOptions,
  storageOptions,
}: ProductCardAddToCartButtonProps) => {
  const hasColors = colorOptions.length > 0;
  const hasStorages = storageOptions.length > 0;
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(
    colorOptions[0]?.value ?? "",
  );
  const [selectedStorage, setSelectedStorage] = useState(
    storageOptions[0]?.value ?? "",
  );
  const { status, isAdded, showAdded, showLimitReached } =
    useAddToCartFeedback();
  const maxAllowed = Math.max(1, Math.min(10, stock));

  const colorSelectOptions = useMemo(
    () =>
      colorOptions.map((option) => ({
        value: option.value,
        label: optionLabel(option, SITE_PRODUCT_SLIDER.pricePrefix),
      })),
    [colorOptions],
  );
  const storageSelectOptions = useMemo(
    () =>
      storageOptions.map((option) => ({
        value: option.value,
        label: optionLabel(option, SITE_PRODUCT_SLIDER.pricePrefix),
      })),
    [storageOptions],
  );

  const addNow = (color: string | null, storage: string | null) => {
    const result = addItemToStoreCart(
      {
        productId,
        name: productName,
        href,
        imagePath,
        unitPrice,
        selectedColor: color,
        selectedStorage: storage,
      },
      1,
      { maxAllowed },
    );
    if (result.ok && result.addedQuantity > 0) {
      showAdded();
      return;
    }
    showLimitReached();
  };

  const buttonLabel = !isInStock
    ? SITE_PRODUCT_DETAIL.addToCartDisabledLabel
    : status === "limit_reached"
      ? LIMIT_REACHED_LABEL
      : isAdded
        ? ADDED_LABEL
        : SITE_PRODUCT_SLIDER.addToCartLabel;

  return (
    <>
      <Button
        type="button"
        variant="primary"
        size="sm"
        fullWidth
        disabled={!isInStock}
        aria-label={`${buttonLabel}: ${productName}`}
        className={`rounded-full transition-all duration-200 ${isAdded ? ADDED_BUTTON_CLASS : ""}`}
        onClick={() => {
          if (!isInStock) return;
          if (hasColors || hasStorages) {
            setIsPickerOpen(true);
            return;
          }
          addNow(null, null);
        }}
      >
        {isAdded ? (
          <IconCheckCircleFilled
            width={16}
            height={16}
            className="text-white"
          />
        ) : (
          <IconCart width={16} height={16} />
        )}
        {buttonLabel}
      </Button>

      <Modal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        title={`Select options for ${productName}`}
        description="Choose your preferred variant before adding to cart."
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsPickerOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                addNow(
                  hasColors ? selectedColor || null : null,
                  hasStorages ? selectedStorage || null : null,
                );
                setIsPickerOpen(false);
              }}
            >
              Add to cart
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          {hasColors ? (
            <SelectField
              name="color"
              label={SITE_PRODUCT_DETAIL.colorSelectLabel}
              value={selectedColor}
              options={colorSelectOptions}
              onChange={(event) => setSelectedColor(event.currentTarget.value)}
            />
          ) : null}
          {hasStorages ? (
            <SelectField
              name="storage"
              label={SITE_PRODUCT_DETAIL.storageOptionsHeading}
              value={selectedStorage}
              options={storageSelectOptions}
              onChange={(event) =>
                setSelectedStorage(event.currentTarget.value)
              }
            />
          ) : null}
        </div>
      </Modal>
    </>
  );
};
