import { STORE_SHELL } from "@/lib/config/site-config";

export default function CategoriesPage() {
  return (
    <main className={`flex-1 py-10 ${STORE_SHELL}`}>
      <h1 className="text-2xl font-semibold">Categories</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Browse phones by category — listings will appear here.
      </p>
    </main>
  );
}
