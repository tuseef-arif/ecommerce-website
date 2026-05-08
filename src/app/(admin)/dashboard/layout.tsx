import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdmin } from "@/lib/auth-guards";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-neutral-100 p-3 md:p-6">
      <div className="mx-auto grid min-h-[calc(100dvh-6rem)] w-full max-w-[1400px] gap-4 lg:grid-cols-[minmax(220px,240px)_minmax(0,1fr)] lg:items-start">
        <div className="h-full lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto">
          <AdminSidebar />
        </div>
        <section className="min-h-[calc(100dvh-7rem)] min-w-0 space-y-4">
          {children}
        </section>
      </div>
    </main>
  );
}
