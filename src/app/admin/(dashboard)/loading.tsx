// One generic skeleton for every admin (dashboard) route — products,
// orders, customers, returns, refunds, reports, team all show a table/
// card-shaped view, so a single shape covers the "admin table loading"
// requirement (spec §50) without a bespoke skeleton per route.
export default function AdminSectionLoading() {
  return (
    <div>
      <div className="h-8 w-48 animate-pulse rounded-sm bg-secondary" />

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-sm border border-border bg-secondary" />
        ))}
      </div>

      <div className="mt-8 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-sm bg-secondary" />
        ))}
      </div>
    </div>
  );
}
