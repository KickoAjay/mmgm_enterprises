"use client";

import { useActionState } from "react";
import { bootstrapFirstAdminAction, type AdminActionState } from "@/lib/auth/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BootstrapAdminForm() {
  const [state, formAction, isPending] = useActionState<AdminActionState, FormData>(
    bootstrapFirstAdminAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" autoComplete="name" required />
      </div>

      {state && "error" in state ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={isPending} className="mt-2 uppercase tracking-wide">
        {isPending ? "Setting up…" : "Become Admin"}
      </Button>
    </form>
  );
}
