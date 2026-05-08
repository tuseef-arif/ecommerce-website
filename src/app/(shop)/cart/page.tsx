"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProductImageWithFallback } from "@/components/store/product-image-with-fallback";
import { Button } from "@/components/ui/button";
import { STORE_SHELL, SITE_PRODUCT_SLIDER } from "@/lib/config/site-config";
import {
  STORE_CART_UPDATED_EVENT,
  getStoreCartItemMaxQuantity,
  readStoreCart,
  removeItemFromStoreCart,
  setStoreCartItemQuantity,
  type StoreCartItem,
} from "@/lib/cart/store-cart";
import { formatProductPriceWithPrefix } from "@/lib/products/format-price";

export default function CartPage() {
  const [items, setItems] = useState<StoreCartItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(readStoreCart());
    sync();
    window.addEventListener(STORE_CART_UPDATED_EVENT, sync);
    return () => window.removeEventListener(STORE_CART_UPDATED_EVENT, sync);
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items],
  );

  return (
    <main className={`flex-1 py-10 ${STORE_SHELL}`}>
      <h1 className="text-3xl font-bold text-neutral-900">My Cart</h1>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-600">Your cart is empty.</p>
      ) : (
        <>
          <div className="mt-6 space-y-3 md:hidden">
            {items.map((item) => (
              <article
                key={`${item.productId}-${item.selectedColor ?? ""}-${item.selectedStorage ?? ""}`}
                className="rounded-xl border border-neutral-300 bg-white p-3"
              >
                <div className="flex items-start justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      removeItemFromStoreCart({
                        productId: item.productId,
                        selectedColor: item.selectedColor,
                        selectedStorage: item.selectedStorage,
                      })
                    }
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-xs font-medium text-neutral-400 transition-colors hover:text-neutral-600"
                    aria-label={`Remove ${item.name}`}
                  >
                    x
                  </button>
                </div>
                <div className="mt-1 flex items-start gap-3">
                  <Link href={item.href} className="block h-16 w-16 shrink-0">
                    <ProductImageWithFallback
                      src={item.imagePath}
                      alt={item.name}
                      className="h-full w-full rounded-lg border border-neutral-100 bg-neutral-50 object-contain p-1.5"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={item.href}
                      className="line-clamp-2 text-base font-medium leading-tight text-neutral-900 hover:text-[var(--store-brand-primary)]"
                    >
                      {item.name}
                    </Link>
                    {item.selectedColor || item.selectedStorage ? (
                      <p className="mt-1 text-xs text-neutral-600">
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
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-neutral-900">
                        {formatProductPriceWithPrefix(
                          item.unitPrice,
                          SITE_PRODUCT_SLIDER.pricePrefix,
                        )}
                      </p>
                      <input
                        type="number"
                        min={1}
                        max={getStoreCartItemMaxQuantity(
                          {
                            productId: item.productId,
                            selectedColor: item.selectedColor,
                            selectedStorage: item.selectedStorage,
                          },
                          items,
                        )}
                        value={item.quantity}
                        onChange={(event) =>
                          setStoreCartItemQuantity(
                            {
                              productId: item.productId,
                              selectedColor: item.selectedColor,
                              selectedStorage: item.selectedStorage,
                            },
                            Number(event.currentTarget.value),
                          )
                        }
                        className="h-9 w-16 rounded-md border border-neutral-300 px-2 text-sm text-neutral-900 outline-none focus:border-[var(--store-brand-primary)]"
                      />
                      <p className="text-sm font-semibold text-neutral-900">
                        {formatProductPriceWithPrefix(
                          item.unitPrice * item.quantity,
                          SITE_PRODUCT_SLIDER.pricePrefix,
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
            <div className="rounded-xl border border-neutral-300 bg-white px-4 py-3">
              <p className="text-right text-xl font-bold text-neutral-900">
                Subtotal:{" "}
                {formatProductPriceWithPrefix(
                  subtotal,
                  SITE_PRODUCT_SLIDER.pricePrefix,
                )}
              </p>
              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  variant="accent"
                  size="md"
                  className="rounded-full px-6"
                >
                  Checkout
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6 hidden overflow-x-auto rounded-xl border border-neutral-300 bg-white md:block">
            <table className="min-w-[760px] w-full border-collapse">
              <thead>
                <tr className="border-b border-neutral-300">
                  <th className="w-20 px-2 py-4 text-left" />
                  <th className="px-2 py-4 text-left text-lg font-semibold text-neutral-900">
                    Product
                  </th>
                  <th className="px-2 py-4 text-left text-lg font-semibold text-neutral-900">
                    Price
                  </th>
                  <th className="px-2 py-4 text-left text-lg font-semibold text-neutral-900">
                    Quantity
                  </th>
                  <th className="px-2 py-4 text-left text-lg font-semibold text-neutral-900">
                    Subtotal
                  </th>
                  <th className="w-10 px-2 py-4 text-left" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={`${item.productId}-${item.selectedColor ?? ""}-${item.selectedStorage ?? ""}`}
                    className="border-b border-neutral-200"
                  >
                    <td className="px-2 py-4 align-middle">
                      <Link href={item.href} className="block h-16 w-16">
                        <ProductImageWithFallback
                          src={item.imagePath}
                          alt={item.name}
                          className="h-full w-full rounded-lg border border-neutral-100 bg-neutral-50 object-contain p-1.5"
                        />
                      </Link>
                    </td>
                    <td className="px-2 py-4 align-middle">
                      <Link
                        href={item.href}
                        className="text-xl font-medium leading-tight text-neutral-900 hover:text-[var(--store-brand-primary)]"
                      >
                        {item.name}
                      </Link>
                      {item.selectedColor || item.selectedStorage ? (
                        <p className="mt-2 text-base text-neutral-600">
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
                    </td>
                    <td className="px-2 py-4 align-middle text-lg font-semibold text-neutral-900">
                      {formatProductPriceWithPrefix(
                        item.unitPrice,
                        SITE_PRODUCT_SLIDER.pricePrefix,
                      )}
                    </td>
                    <td className="px-2 py-4 align-middle">
                      <input
                        type="number"
                        min={1}
                        max={getStoreCartItemMaxQuantity(
                          {
                            productId: item.productId,
                            selectedColor: item.selectedColor,
                            selectedStorage: item.selectedStorage,
                          },
                          items,
                        )}
                        value={item.quantity}
                        onChange={(event) =>
                          setStoreCartItemQuantity(
                            {
                              productId: item.productId,
                              selectedColor: item.selectedColor,
                              selectedStorage: item.selectedStorage,
                            },
                            Number(event.currentTarget.value),
                          )
                        }
                        className="h-10 w-20 rounded-md border border-neutral-300 px-2 text-base text-neutral-900 outline-none focus:border-[var(--store-brand-primary)]"
                      />
                    </td>
                    <td className="px-2 py-4 align-middle text-lg font-semibold text-neutral-900">
                      {formatProductPriceWithPrefix(
                        item.unitPrice * item.quantity,
                        SITE_PRODUCT_SLIDER.pricePrefix,
                      )}
                    </td>
                    <td className="px-2 py-4 align-middle">
                      <button
                        type="button"
                        onClick={() =>
                          removeItemFromStoreCart({
                            productId: item.productId,
                            selectedColor: item.selectedColor,
                            selectedStorage: item.selectedStorage,
                          })
                        }
                        className="inline-flex h-7 w-7 items-center justify-center text-sm font-medium text-neutral-400 transition-colors hover:text-neutral-600"
                        aria-label={`Remove ${item.name}`}
                      >
                        x
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end border-t border-neutral-300 px-4 py-4">
              <div className="flex flex-col items-end gap-3">
                <p className="text-2xl font-bold text-neutral-900">
                  Subtotal:{" "}
                  {formatProductPriceWithPrefix(
                    subtotal,
                    SITE_PRODUCT_SLIDER.pricePrefix,
                  )}
                </p>
                <Button
                  type="button"
                  variant="accent"
                  size="md"
                  className="rounded-full px-8"
                >
                  Checkout
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
