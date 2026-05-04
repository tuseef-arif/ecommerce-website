import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { updateGlobalSaleAction } from "./actions";

export default async function AdminPage() {
  const user = await requireAdmin();
  const globalSetting = await prisma.globalSetting.findUnique({
    where: { id: 1 },
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-16">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">Admin dashboard</h1>
        <p className="text-sm text-neutral-600">
          Signed in as {user.email}. Manage privileged shop settings here.
        </p>
      </section>

      <section className="rounded-md border border-neutral-200 p-4">
        <h2 className="text-base font-medium">Global sale settings</h2>
        <form action={updateGlobalSaleAction} className="mt-4 space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              name="globalSaleEnabled"
              type="checkbox"
              defaultChecked={globalSetting?.globalSaleEnabled ?? false}
            />
            Enable global sale
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Sale percent</span>
            <input
              name="globalSalePercent"
              type="number"
              min={0}
              max={90}
              step="0.01"
              defaultValue={globalSetting?.globalSalePercent.toString() ?? "0"}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white"
          >
            Save settings
          </button>
        </form>
      </section>
    </main>
  );
}
