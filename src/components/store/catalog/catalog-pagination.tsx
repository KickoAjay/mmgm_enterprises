import Link from "next/link";
import { buildCatalogHref } from "@/features/products/catalog-url";

export function CatalogPagination({
  basePath,
  current,
  page,
  pageCount,
}: {
  basePath: string;
  current: Record<string, string | undefined>;
  page: number;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;

  return (
    <nav
      className="mt-12 flex items-center justify-center gap-6"
      aria-label="Pagination"
    >
      {page > 1 ? (
        <Link
          href={buildCatalogHref(basePath, current, { page: String(page - 1) })}
          className="text-sm text-foreground hover:text-primary"
        >
          ← Previous
        </Link>
      ) : (
        <span className="text-sm text-muted-foreground">← Previous</span>
      )}
      <span className="text-sm text-muted-foreground">
        Page {page} of {pageCount}
      </span>
      {page < pageCount ? (
        <Link
          href={buildCatalogHref(basePath, current, { page: String(page + 1) })}
          className="text-sm text-foreground hover:text-primary"
        >
          Next →
        </Link>
      ) : (
        <span className="text-sm text-muted-foreground">Next →</span>
      )}
    </nav>
  );
}
