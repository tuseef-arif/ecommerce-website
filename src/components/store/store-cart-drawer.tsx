"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { IconX } from "@/components/icons";
import { ProductImageWithFallback } from "@/components/store/product-image-with-fallback";
import { Button } from "@/components/ui/button";
import {
  STORE_CART_UPDATED_EVENT,
  readStoreCart,
  removeItemFromStoreCart,
  type StoreCartItem,
} from "@/lib/cart/store-cart";
import { SITE_PRODUCT_SLIDER, SITE_ROUTES } from "@/lib/config/site-config";
import { formatProductPriceWithPrefix } from "@/lib/products/format-price";

type StoreCartDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const StoreCartDrawer = ({ isOpen, onClose }: StoreCartDrawerProps) => {
  const [items, setItems] = useState<StoreCartItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(readStoreCart());
    sync();
    window.addEventListener(STORE_CART_UPDATED_EVENT, sync);
    return () => window.removeEventListener(STORE_CART_UPDATED_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close cart"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className="absolute right-0 top-0 flex h-[100dvh] w-[min(22rem,92vw)] flex-col bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <h2 className="text-base font-semibold text-neutral-900">
            Your Cart
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
          >
            <IconX width={20} height={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {items.length === 0 ? (
            <p className="text-sm text-neutral-600">
              Your cart is feeling a little light! 🛒 <br></br>Let’s fix
              that—check out our latest arrivals and find something you love.
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <article
                  key={`${item.productId}-${item.selectedColor ?? ""}-${item.selectedStorage ?? ""}`}
                  className="border-b border-neutral-200 pb-3"
                >
                  <div className="flex items-start gap-3">
                    <Link
                      href={item.href}
                      className="block h-16 w-16 shrink-0 rounded-lg border border-neutral-100 bg-neutral-50"
                      onClick={onClose}
                    >
                      <ProductImageWithFallback
                        src={item.imagePath}
                        alt={item.name}
                        className="h-full w-full rounded-lg object-contain p-1.5"
                        loading="lazy"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={item.href}
                        className="line-clamp-2 text-sm font-medium text-neutral-900 hover:text-[var(--store-brand-primary)]"
                        onClick={onClose}
                      >
                        {item.name}
                      </Link>
                      <p className="mt-1 text-xs font-semibold text-neutral-900">
                        {item.quantity} x{" "}
                        {formatProductPriceWithPrefix(
                          item.unitPrice,
                          SITE_PRODUCT_SLIDER.pricePrefix,
                        )}
                      </p>
                      {item.selectedColor || item.selectedStorage ? (
                        <p className="mt-1 text-[11px] text-neutral-500">
                          {item.selectedColor
                            ? `Color: ${item.selectedColor}`
                            : ""}
                          {item.selectedColor && item.selectedStorage
                            ? " · "
                            : ""}
                          {item.selectedStorage
                            ? `Storage: ${item.selectedStorage}`
                            : ""}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${item.name}`}
                      onClick={() =>
                        removeItemFromStoreCart({
                          productId: item.productId,
                          selectedColor: item.selectedColor,
                          selectedStorage: item.selectedStorage,
                        })
                      }
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center text-neutral-400 transition-colors hover:text-neutral-600"
                    >
                      <IconX width={14} height={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-neutral-200 px-4 py-4">
          <p className="mb-3 text-center text-2xl font-semibold text-neutral-900">
            Subtotal:{" "}
            {formatProductPriceWithPrefix(
              subtotal,
              SITE_PRODUCT_SLIDER.pricePrefix,
            )}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Link href={SITE_ROUTES.cart} onClick={onClose}>
              <Button
                type="button"
                variant="primary"
                size="md"
                fullWidth
                className="rounded-full"
              >
                View cart
              </Button>
            </Link>
            <Link href={SITE_ROUTES.checkout} onClick={onClose}>
              <Button
                type="button"
                variant="accent"
                size="md"
                fullWidth
                className="rounded-full"
              >
                Checkout
              </Button>
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
};
