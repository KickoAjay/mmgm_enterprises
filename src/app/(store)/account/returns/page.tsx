import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getMyReturns } from "@/features/returns/queries";
import { RETURN_STATUS_LABELS, type ReturnStatus } from "@/features/returns/status";
import { formatOrderDate } from "@/features/orders/format";

export const metadata = {
  title: "My Returns",
};

export default async function ReturnsPage() {
  await requireUser();
  const returns = await getMyReturns();

  if (returns.length === 0) {
    return (
      <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif text-section text-foreground">No returns yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You can request a return from a delivered order&apos;s details page.
        </p>
        <Link
          href="/account/orders"
          className="mt-6 text-sm text-primary underline-offset-4 hover:underline"
        >
          View Orders
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-serif text-section text-foreground">My Returns</h1>

      <div className="mt-8 flex flex-col gap-4">
        {returns.map((ret) => (
          <Link
            key={ret.id}
            href={`/account/returns/${ret.id}`}
            className="flex flex-col gap-2 border border-border p-5 transition-colors hover:border-primary sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-medium text-foreground">
                Order {ret.orderNumber}
              </p>
              <p className="text-meta mt-1 text-muted-foreground">{ret.itemSummary}</p>
              <p className="text-meta mt-1 text-muted-foreground">
                Requested {formatOrderDate(ret.requestedAt)}
              </p>
            </div>
            <span className="text-meta font-medium text-foreground">
              {RETURN_STATUS_LABELS[ret.status as ReturnStatus] ?? ret.status}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
