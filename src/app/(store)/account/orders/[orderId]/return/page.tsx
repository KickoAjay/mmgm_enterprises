import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getReturnEligibility } from "@/features/returns/eligibility";
import { ReturnRequestForm } from "@/components/store/returns/return-request-form";

export const metadata = {
  title: "Request a Return | MMGM Enterprises",
};

export default async function RequestReturnPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const user = await requireUser();
  const { orderId } = await params;
  const eligibility = await getReturnEligibility(orderId);

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <h1 className="font-serif text-section text-foreground">Request a Return</h1>

      {!eligibility.eligible ? (
        <div className="mt-6 border border-border bg-secondary p-4 text-sm text-foreground">
          {eligibility.reason}
          <div className="mt-3">
            <Link
              href={`/account/orders/${orderId}`}
              className="text-primary underline-offset-4 hover:underline"
            >
              Back to order
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <ReturnRequestForm orderId={orderId} userId={user.id} items={eligibility.items} />
        </div>
      )}
    </main>
  );
}
