import Link from "next/link";
import { getCatalogPage } from "@/features/products/catalog";
import { FilterSidebar } from "@/components/store/catalog/filter-sidebar";
import { CatalogSort } from "@/components/store/catalog/catalog-sort";
import { CatalogPagination } from "@/components/store/catalog/catalog-pagination";
import { MobileFilterDrawer } from "@/components/store/catalog/mobile-filter-drawer";
import { ProductCard } from "@/components/store/product-card";

const BASE_PATH = "/sarees";

export const metadata = {
  title: "Sarees",
  description: "Shop the full MMGM Enterprises saree collection.",
  // Points every filter/sort/page combination at the base listing —
  // those query params produce the same content in different orders,
  // which search engines would otherwise index as near-duplicate pages.
  alternates: { canonical: "/sarees" },
};

export default async function SareesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const current: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(rawParams)) {
    current[key] = Array.isArray(value) ? value[0] : value;
  }

  const result = await getCatalogPage(current);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="font-serif text-section text-foreground">Sarees</h1>
        <p className="text-sm text-muted-foreground">
          {result.totalCount} {result.totalCount === 1 ? "saree" : "sarees"} — quality-checked &amp;
          refurbished
        </p>
        <form
          action={BASE_PATH}
          method="GET"
          className="mt-2 max-w-sm"
          role="search"
        >
          <input
            type="search"
            name="q"
            defaultValue={current.q ?? ""}
            placeholder="Search sarees, fabrics, colors…"
            className="w-full border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </form>
      </div>

      {/* Mobile sticky filter/sort bar */}
      <div className="sticky top-25 z-30 -mx-6 mb-6 flex items-center justify-between border-y border-border bg-background px-6 py-3 lg:hidden">
        <MobileFilterDrawer>
          <FilterSidebar
            basePath={BASE_PATH}
            current={current}
            filterOptions={result.filterOptions}
          />
        </MobileFilterDrawer>
        <CatalogSort />
      </div>

      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <span className="text-meta font-semibold tracking-wide text-foreground uppercase">
            Filters
          </span>
          <div className="mt-4">
            <FilterSidebar
              basePath={BASE_PATH}
              current={current}
              filterOptions={result.filterOptions}
            />
          </div>
        </aside>

        <div>
          <div className="mb-6 hidden justify-end lg:flex">
            <CatalogSort />
          </div>

          {result.items.length === 0 ? (
            <div className="flex flex-col items-center py-24 text-center">
              <p className="text-lg font-medium text-foreground">
                No sarees found
              </p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Try adjusting your filters or search — or browse our full
                collection.
              </p>
              <Link
                href={BASE_PATH}
                className="mt-4 text-sm font-semibold tracking-wide text-primary uppercase underline-offset-4 hover:underline"
              >
                Clear filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
              {result.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <CatalogPagination
            basePath={BASE_PATH}
            current={current}
            page={result.page}
            pageCount={result.pageCount}
          />
        </div>
      </div>
    </main>
  );
}
