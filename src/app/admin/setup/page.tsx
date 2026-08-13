import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/db/service";
import { BootstrapAdminForm } from "@/components/admin/bootstrap-admin-form";

export const metadata = {
  title: "Admin Setup | MMGM Enterprises",
};

// Only reachable while no admin account exists yet — once the first one
// is created, this always redirects away (the RLS policy backing
// bootstrapFirstAdminAction is just as self-limiting, this is just the
// UX-level equivalent so the page doesn't dead-end in a form that will
// always fail).
export default async function AdminSetupPage() {
  const user = await requireUser();

  const supabase = createServiceClient();
  const { count } = await supabase
    .from("admin_users")
    .select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0) {
    redirect("/admin/login");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <div className="border border-border bg-background p-8">
        <span className="text-meta font-semibold tracking-[0.2em] text-primary uppercase">
          MMGM Enterprises
        </span>
        <h1 className="mt-2 font-serif text-2xl text-foreground">Set Up Admin Access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No admin account exists yet. Signed in as {user.email} — set this account up as the
          first administrator.
        </p>
        <div className="mt-8">
          <BootstrapAdminForm />
        </div>
      </div>
    </main>
  );
}
