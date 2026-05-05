import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdmin } from "@/lib/auth-guards";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-neutral-100 p-4 md:p-6">
      <div className="mx-auto grid w-full max-w-[1400px] gap-4 lg:grid-cols-[260px_1fr]">
        <AdminSidebar />
        <section className="space-y-4">{children}</section>
      </div>
    </main>
  );
}
