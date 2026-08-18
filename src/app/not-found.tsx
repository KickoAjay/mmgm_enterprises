import Link from "next/link";
import { Button } from "@/components/ui/button";

// Root not-found — used both for genuinely unmatched routes and for
// every explicit notFound() call (e.g. an unknown product slug). Sits
// above (store)/layout.tsx, so it renders without the storefront Header/
// Footer, same tradeoff as error.tsx.
export const metadata = { title: "Page Not Found" };

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <span className="text-meta font-semibold tracking-[0.2em] text-primary uppercase">
        MMGM Enterprises
      </span>
      <h1 className="mt-4 font-serif text-section text-foreground">Page Not Found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button asChild className="uppercase tracking-wide">
          <Link href="/sarees">Shop Sarees</Link>
        </Button>
        <Button asChild variant="outline" className="uppercase tracking-wide">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    </main>
  );
}
