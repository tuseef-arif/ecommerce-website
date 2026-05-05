import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductFilters } from "@/components/admin/product-filters";
import { ProductListStatusBanner } from "@/components/admin/product-list-status-banner";
import { ProductPagination } from "@/components/admin/product-pagination";
import { ProductTable } from "@/components/admin/product-table";
import {
  listAdminProductCategories,
  listAdminProductDistinctBrands,
  listAdminProducts,
} from "@/lib/products/admin-data";
import {
  parseAdminProductsListFilters,
  parseAdminProductsListStatus,
} from "@/lib/products/filters";

type DashboardProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  title: "Products · Admin",
};

export default async function DashboardProductsPage({
  searchParams,
}: DashboardProductsPageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = parseAdminProductsListFilters(resolvedSearchParams);
  const status = parseAdminProductsListStatus(resolvedSearchParams.status);

  const [products, brands, categories] = await Promise.all([
    listAdminProducts(filters),
    listAdminProductDistinctBrands(),
    listAdminProductCategories(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Products"
        description="Manage your catalog: brands, pricing, stock, and visibility."
        actions={
          <Link
            href="/dashboard/products/new"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--store-brand-primary)] px-4 text-sm font-semibold text-white shadow-sm transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
          >
            + Create product
          </Link>
        }
      />

      <ProductListStatusBanner status={status} />

      <ProductFilters
        filters={filters}
        brands={brands}
        categories={categories}
      />

      <ProductTable items={products.items} />

      <ProductPagination
        filters={filters}
        page={products.page}
        pageCount={products.pageCount}
        totalCount={products.totalCount}
      />
    </>
  );
}
