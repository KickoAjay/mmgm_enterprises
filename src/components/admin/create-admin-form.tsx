"use client";

import { useActionState } from "react";
import { createAdminAction, type AdminActionState } from "@/lib/auth/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateAdminForm({ roles }: { roles: { id: string; name: string }[] }) {
  const [state, formAction, isPending] = useActionState<AdminActionState, FormData>(
    createAdminAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Registered customer email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="roleId">Role</Label>
        <select
          id="roleId"
          name="roleId"
          required
          defaultValue=""
          className="border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          <option value="" disabled>
            Select a role
          </option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </div>

      {state && "error" in state ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state && "success" in state ? (
        <p className="text-sm text-foreground">Admin added.</p>
      ) : null}

      <Button type="submit" disabled={isPending} className="w-fit uppercase tracking-wide">
        {isPending ? "Adding…" : "Add Admin"}
      </Button>
    </form>
  );
}
