import Image from "next/image";
import Link from "next/link";

type BrandLogoItem = {
  name: string;
  imagePath: string;
};

const BRAND_LOGOS: ReadonlyArray<BrandLogoItem> = [
  { name: "Apple", imagePath: "/assets/brand/Apple.jpg" },
  { name: "Baseus", imagePath: "/assets/brand/Baseus.webp" },
  { name: "Xiaomi", imagePath: "/assets/brand/Xiaomi.webp" },
  { name: "Samsung", imagePath: "/assets/brand/Samsung.webp" },
  { name: "Tecno", imagePath: "/assets/brand/Tecno.webp" },
  { name: "Oppo", imagePath: "/assets/brand/Oppo.png" },
  { name: "RealMe", imagePath: "/assets/brand/RealMe.webp" },
  { name: "Infinix", imagePath: "/assets/brand/Infinix.png" },
];

const buildBrandHref = (brandName: string): string => {
  const params = new URLSearchParams();
  params.set("brand", brandName);
  return `/products?${params.toString()}#products-top`;
};

export const BrandLogosPanel = () => (
  <section
    aria-label="Shop by brand"
    className="rounded-2xl border border-neutral-200 bg-white px-3 py-5 sm:px-4 sm:py-6"
  >
    <h2 className="mb-4 text-center text-2xl font-semibold leading-tight text-[var(--store-brand-primary)] sm:mb-5 sm:text-3xl">
      Shop By Brand
    </h2>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {BRAND_LOGOS.map((brand) => (
        <Link
          key={brand.name}
          href={buildBrandHref(brand.name)}
          className="group relative flex h-24 items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          title={brand.name}
          aria-label={`View ${brand.name} products`}
        >
          <Image
            src={brand.imagePath}
            alt={brand.name}
            width={180}
            height={72}
            className="max-h-14 w-auto object-contain transition-transform duration-300 ease-out group-hover:scale-105 group-focus-visible:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-focus-visible:scale-100"
            loading="lazy"
          />
          <span className="pointer-events-none absolute bottom-2 rounded-full bg-white/95 px-2 py-0.5 text-xs font-semibold text-neutral-700 opacity-0 shadow-sm transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
            {brand.name}
          </span>
        </Link>
      ))}
    </div>
  </section>
);
