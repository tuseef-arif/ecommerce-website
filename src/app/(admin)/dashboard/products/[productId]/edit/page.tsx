import Link from "next/link";
import { notFound } from "next/navigation";
import { updateProductAction } from "@/app/(admin)/dashboard/products/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductForm } from "@/components/admin/product-form";
import {
  getAdminProductById,
  listAdminProductCategories,
} from "@/lib/products/admin-data";

type EditProductPageProps = {
  params: Promise<{ productId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  title: "Edit product · Admin",
};

export default async function EditProductPage({
  params,
  searchParams,
}: EditProductPageProps) {
  const { productId } = await params;
  const resolvedSearchParams = await searchParams;
  const listParams = new URLSearchParams();
  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (key === "status") continue;
    if (Array.isArray(value)) {
      const first = value[0];
      if (typeof first === "string" && first.length > 0)
        listParams.set(key, first);
      continue;
    }
    if (typeof value === "string" && value.length > 0)
      listParams.set(key, value);
  }
  const returnTo =
    listParams.toString().length > 0
      ? `/dashboard/products?${listParams.toString()}`
      : "/dashboard/products";

  const [product, categories] = await Promise.all([
    getAdminProductById(productId),
    listAdminProductCategories(),
  ]);

  if (!product) notFound();

  return (
    <>
      <AdminPageHeader
        title={`Edit · ${product.name}`}
        description="Update product details. The public URL is preserved across edits."
        actions={
          <Link
            href={returnTo}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-transparent bg-[var(--store-brand-primary)] px-4 text-sm font-semibold text-white shadow-sm transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
          >
            Back to products
          </Link>
        }
      />

      <ProductForm
        mode="edit"
        action={updateProductAction}
        categories={categories}
        initialProduct={product}
        cancelHref={returnTo}
        returnTo={returnTo}
      />
    </>
  );
}
