export default function DashboardCustomersLoading() {
  return (
    <>
      <div className="h-20 animate-pulse rounded-2xl border border-neutral-200 bg-white" />
      <div className="h-24 animate-pulse rounded-2xl border border-neutral-200 bg-white" />
      <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`customer-skeleton-${index}`}
            className="h-14 animate-pulse rounded-lg bg-neutral-100"
          />
        ))}
      </div>
    </>
  );
}
