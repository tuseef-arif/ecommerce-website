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
            className="inline-flex h-10 items-center justify-center rounded-lg border border-transparent bg-[var(--store-brand-primary)] px-4 text-sm font-semibold text-white shadow-sm transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
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
