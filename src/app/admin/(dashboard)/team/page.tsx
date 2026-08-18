import { getAdminTeam, getAdminRoles } from "@/lib/auth/admin-actions";
import { formatOrderDate } from "@/features/orders/format";
import { CreateAdminForm } from "@/components/admin/create-admin-form";
import { ToggleAdminActiveButton } from "@/components/admin/toggle-admin-active-button";

export const metadata = {
  title: "Team",
};

// getAdminTeam/getAdminRoles both call requireRole(["SUPER_ADMIN"])
// internally, so only a SUPER_ADMIN ever gets past this page's data
// fetch — everyone else was already redirected by the sidebar not
// linking here, but this is the actual enforcement point.
export default async function AdminTeamPage() {
  const [team, roles] = await Promise.all([getAdminTeam(), getAdminRoles()]);

  return (
    <div>
      <h1 className="font-serif text-2xl text-foreground">Team</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="overflow-x-auto border border-border bg-background">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-meta text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Last Login</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {team.map((member) => (
                <tr key={member.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-foreground">{member.fullName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
                  <td className="px-4 py-3 text-foreground">{member.roleName}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {member.lastLoginAt ? formatOrderDate(member.lastLoginAt) : "Never"}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {member.isActive ? "Active" : "Inactive"}
                  </td>
                  <td className="px-4 py-3">
                    <ToggleAdminActiveButton adminUserId={member.id} isActive={member.isActive} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border border-border p-6">
          <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
            Add Admin
          </h2>
          <p className="text-meta mt-2 text-muted-foreground">
            Promotes an existing registered customer account — they must sign up on the
            storefront first.
          </p>
          <div className="mt-4">
            <CreateAdminForm roles={roles} />
          </div>
        </div>
      </div>
    </div>
  );
}
