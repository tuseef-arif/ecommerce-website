"use client";

import { useMemo, useState } from "react";
import { SelectField } from "@/components/ui/select-field";
import { SITE_PRODUCT_DETAIL } from "@/lib/config/site-config";

type ProductVariantSelectorsProps = {
  /** Admin-managed color names (already de-duped, defensively trimmed). */
  colorOptions: ReadonlyArray<string>;
  /** Admin-managed storage variants (e.g. "128 GB"). */
  storageOptions: ReadonlyArray<string>;
};

/**
 * Inline floating-label dropdowns for picking a color and/or storage variant
 * on the product detail page. Selection is local UI state only — no server
 * action yet, same stance as the "Add to cart" / "Compare" buttons. When the
 * cart wires up, this component will own the selected variant ids and bubble
 * them upstream.
 *
 * Renders nothing when both option lists are empty so the detail layout
 * doesn't reserve unused vertical space.
 *
 * Layout:
 * - Mobile (<sm): single column, each dropdown spans the row.
 * - Tablet+ (sm:+): two-column grid so Color + Storage sit side-by-side.
 *   The whole section is capped to `sm:max-w-xl` so it stays aligned with
 *   the "Add to Cart" + "Compare" button row beneath it instead of
 *   stretching across the entire info column on wide desktops.
 * - When only one of the two lists is present we drop back to a single
 *   column with `sm:max-w-sm` so a lone dropdown doesn't stretch unnaturally.
 */
export const ProductVariantSelectors = ({
  colorOptions,
  storageOptions,
}: ProductVariantSelectorsProps) => {
  const hasColors = colorOptions.length > 0;
  const hasStorages = storageOptions.length > 0;

  const colorSelectOptions = useMemo(
    () => colorOptions.map((value) => ({ value, label: value })),
    [colorOptions],
  );
  const storageSelectOptions = useMemo(
    () => storageOptions.map((value) => ({ value, label: value })),
    [storageOptions],
  );

  const [selectedColor, setSelectedColor] = useState<string>(
    () => colorOptions[0] ?? "",
  );
  const [selectedStorage, setSelectedStorage] = useState<string>(
    () => storageOptions[0] ?? "",
  );

  if (!hasColors && !hasStorages) return null;

  const showsBothColumns = hasColors && hasStorages;
  const sectionClass = showsBothColumns
    ? "grid w-full grid-cols-1 gap-3 sm:max-w-xl sm:grid-cols-2 sm:gap-4"
    : "grid w-full grid-cols-1 gap-3 sm:max-w-sm";

  return (
    <section
      aria-label={SITE_PRODUCT_DETAIL.colorOptionsHeading}
      className={sectionClass}
    >
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
    </section>
  );
};
