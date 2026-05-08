import { ProductRowActions } from "@/components/admin/product-row-actions";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AdminProductListItem } from "@/lib/products/admin-types";

type ProductTableProps = {
  items: ReadonlyArray<AdminProductListItem>;
};

const formatPriceDisplay = (price: string): string => {
  const numeric = Number.parseFloat(price);
  if (!Number.isFinite(numeric)) return price;
  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const stockTone = (stock: number): "danger" | "warning" | "success" => {
  if (stock <= 0) return "danger";
  if (stock < 10) return "warning";
  return "success";
};

export const ProductTable = ({ items }: ProductTableProps) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
        <p className="text-base font-semibold text-neutral-900">
          No products match your filters.
        </p>
        <p className="text-sm text-neutral-500">
          Try clearing filters, or create a new product to populate the catalog.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] table-fixed text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            <tr>
              <th scope="col" className="w-[34%] px-4 py-3">
                Product
              </th>
              <th scope="col" className="w-[13%] px-4 py-3">
                Brand
              </th>
              <th scope="col" className="w-[13%] px-4 py-3">
                Category
              </th>
              <th scope="col" className="w-[12%] px-4 py-3 text-right">
                Price
              </th>
              <th scope="col" className="w-[9%] px-4 py-3 text-right">
                Stock
              </th>
              <th scope="col" className="w-[9%] px-4 py-3">
                Status
              </th>
              <th scope="col" className="w-[10%] px-4 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-neutral-50/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
                      {item.imagePath ? (
                        // eslint-disable-next-line @next/next/no-img-element -- admin thumbnails; remote+local mixed src, no perf budget
                        <img
                          src={item.imagePath}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-[10px] font-semibold uppercase text-neutral-400">
                          No image
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-neutral-900">
                        {item.name}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="truncate px-4 py-3 text-neutral-700">
                  {item.brand}
                </td>
                <td className="truncate px-4 py-3 text-neutral-700">
                  {item.category.name}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-neutral-900">
                  {formatPriceDisplay(item.finalPrice)}
                </td>
                <td className="px-4 py-3 text-right">
                  <StatusBadge tone={stockTone(item.stock)}>
                    {item.stock}
                  </StatusBadge>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge tone={item.isActive ? "success" : "neutral"}>
                    {item.isActive ? "Active" : "Inactive"}
                  </StatusBadge>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <ProductRowActions
                    productId={item.id}
                    productName={item.name}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
