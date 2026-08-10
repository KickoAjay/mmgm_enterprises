import { requireUser } from "@/lib/auth/session";
import { signOutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

// Minimal placeholder landing page proving the auth flow works end-to-end.
// The real account dashboard (orders, addresses, wishlist, returns,
// refunds, reviews — spec §26) is built alongside those respective
// features in later phases.
export default async function AccountPage() {
  const user = await requireUser();

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-24">
      <span className="text-meta font-semibold tracking-[0.2em] text-primary uppercase">
        MMGM Enterprises
      </span>
      <h1 className="mt-4 font-serif text-2xl text-foreground">Welcome back</h1>
      <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>

      <form action={signOutAction} className="mt-8">
        <Button
          type="submit"
          variant="outline"
          className="uppercase tracking-wide"
        >
          Log out
        </Button>
      </form>
    </main>
  );
}
