import Link from "next/link";
import { HeroSlideRowActions } from "@/components/admin/hero-slide-row-actions";
import { IconPencil } from "@/components/icons";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AdminHeroSlideListItem } from "@/lib/hero/admin-types";

type HeroSlideTableProps = {
  items: ReadonlyArray<AdminHeroSlideListItem>;
};

export const HeroSlideTable = ({ items }: HeroSlideTableProps) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
        <p className="text-base font-semibold text-neutral-900">
          No hero slides yet.
        </p>
        <p className="text-sm text-neutral-500">
          Create one to start rotating the storefront banner. Until then the
          built-in fallback slides are shown.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] table-fixed text-left text-sm">
          <colgroup>
            <col style={{ width: "2.5rem" }} />
            <col style={{ width: "6rem" }} />
            <col />
            <col style={{ width: "8rem" }} />
            <col style={{ width: "8rem" }} />
            <col style={{ width: "5rem" }} />
            <col style={{ width: "7rem" }} />
            <col style={{ width: "11rem" }} />
          </colgroup>
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            <tr>
              <th scope="col" className="w-0 p-0 py-3 pl-2 pr-0 text-center">
                <span className="sr-only">Edit</span>
              </th>
              <th scope="col" className="px-4 py-3">
                Image
              </th>
              <th scope="col" className="px-4 py-3">
                Name
              </th>
              <th scope="col" className="px-4 py-3">
                Specs
              </th>
              <th scope="col" className="px-4 py-3">
                Linked products
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Order
              </th>
              <th scope="col" className="px-4 py-3">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {items.map((item) => {
              const editHref = `/dashboard/banner/${item.id}/edit`;
              return (
                <tr key={item.id} className="hover:bg-neutral-50/60">
                  <td className="w-0 p-0 py-3 pl-2 pr-0 text-center align-middle">
                    <Link
                      href={editHref}
                      className="inline-flex size-7 items-center justify-center rounded-md text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-brand-primary)]"
                      aria-label={`Edit slide ${item.name}`}
                    >
                      <IconPencil width={16} height={16} />
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex h-14 w-20 items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
                      {item.imagePath ? (
                        // eslint-disable-next-line @next/next/no-img-element -- mixed local/remote thumbnail
                        <img
                          src={item.imagePath}
                          alt={item.imageAlt}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-xs text-neutral-400">none</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="truncate font-semibold text-neutral-900">
                      {item.name}
                    </p>
                    <p
                      className="truncate text-xs text-neutral-500"
                      title={item.imageAlt}
                    >
                      {item.imageAlt}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-700">
                    <span title={item.specs.join(" · ")}>
                      {item.specs.length} line
                      {item.specs.length === 1 ? "" : "s"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-700">
                    {item.linkedProductCount === 0 ? (
                      <span className="text-neutral-400">Not clickable</span>
                    ) : (
                      <span>
                        {item.linkedProductCount} product
                        {item.linkedProductCount === 1 ? "" : "s"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-neutral-900">
                    {item.sortOrder}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={item.isActive ? "success" : "neutral"}>
                      {item.isActive ? "Active" : "Inactive"}
                    </StatusBadge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <HeroSlideRowActions
                      slideId={item.id}
                      slideName={item.name}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
