"use client";

const PRODUCT_FALLBACK_IMAGE_SRC = "/uploads/products/product-fallback.png";

type ProductImageWithFallbackProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
  decoding?: "async" | "auto" | "sync";
  fetchPriority?: "high" | "low" | "auto";
};

/**
 * Renders a product image that gracefully switches to a local backup asset
 * when the original URL is missing or fails to load (404/network errors).
 */
export const ProductImageWithFallback = ({
  src,
  alt,
  className = "",
  loading = "lazy",
  decoding = "async",
  fetchPriority = "auto",
}: ProductImageWithFallbackProps) => {
  const initialSrc =
    src && src.trim().length > 0 ? src : PRODUCT_FALLBACK_IMAGE_SRC;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- product images can be mixed-origin uploads/blob URLs and need runtime onError fallback
    <img
      key={initialSrc}
      src={initialSrc}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      onError={(event) => {
        if (event.currentTarget.dataset.fallbackApplied === "true") return;
        event.currentTarget.dataset.fallbackApplied = "true";
        event.currentTarget.onerror = null;
        event.currentTarget.src = PRODUCT_FALLBACK_IMAGE_SRC;
      }}
    />
  );
};
