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
};

export const metadata = {
  title: "Edit product · Admin",
};

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { productId } = await params;

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
            href="/dashboard/products"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
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
      />
    </>
  );
}
