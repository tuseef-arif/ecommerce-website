import Link from "next/link";
import { createProductAction } from "@/app/(admin)/dashboard/products/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductForm } from "@/components/admin/product-form";
import { listAdminProductCategories } from "@/lib/products/admin-data";

export const metadata = {
  title: "Create product · Admin",
};

export default async function NewProductPage() {
  const categories = await listAdminProductCategories();

  return (
    <>
      <AdminPageHeader
        title="Create product"
        description="Add a new product to the catalog."
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
        mode="create"
        action={createProductAction}
        categories={categories}
      />
    </>
  );
}
