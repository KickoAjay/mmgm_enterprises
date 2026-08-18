// Shown while getCatalogPage resolves (a filter/sort/search/page change,
// or the first load). Mirrors the real page's grid shape
// (lg:grid-cols-[240px_1fr], 2/3/4-col product grid) so there's no
// layout shift when the real content swaps in.
export default function SareesLoading() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6 h-8 w-40 animate-pulse rounded-sm bg-secondary" />

      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="h-4 w-16 animate-pulse rounded-sm bg-secondary" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-sm bg-secondary" />
            ))}
          </div>
        </aside>

        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[3/4] w-full animate-pulse rounded-sm bg-secondary" />
              <div className="mt-3 h-3 w-3/4 animate-pulse rounded-sm bg-secondary" />
              <div className="mt-2 h-3 w-1/2 animate-pulse rounded-sm bg-secondary" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
