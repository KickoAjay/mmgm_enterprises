// Shown while getProductDetail resolves. Mirrors the real page's
// two-column gallery/info layout (lg:grid-cols-2) to avoid layout shift.
export default function ProductDetailLoading() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="h-4 w-64 animate-pulse rounded-sm bg-secondary" />

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="aspect-square w-full animate-pulse rounded-sm bg-secondary" />

        <div className="flex flex-col gap-4">
          <div className="h-8 w-3/4 animate-pulse rounded-sm bg-secondary" />
          <div className="h-4 w-1/3 animate-pulse rounded-sm bg-secondary" />
          <div className="h-6 w-1/4 animate-pulse rounded-sm bg-secondary" />
          <div className="mt-4 h-11 w-full animate-pulse rounded-sm bg-secondary" />
          <div className="h-11 w-full animate-pulse rounded-sm bg-secondary" />
        </div>
      </div>
    </main>
  );
}
