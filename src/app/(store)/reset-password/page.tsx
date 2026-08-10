"use client";

import { useActionState } from "react";
import { updatePasswordAction, type AuthActionState } from "@/lib/auth/actions";
import { AuthCard } from "@/components/store/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Reached via the emailed reset link → src/app/auth/callback/route.ts
// exchanges the code for a recovery session, then redirects here.
export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState<
    AuthActionState,
    FormData
  >(updatePasswordAction, null);

  return (
    <AuthCard
      title="Set a new password"
      description="Choose a new password for your account."
    >
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
          />
        </div>

        {state && "error" in state ? (
          <p className="text-sm text-destructive">{state.error}</p>
        ) : null}

        <Button
          type="submit"
          disabled={isPending}
          className="mt-2 uppercase tracking-wide"
        >
          {isPending ? "Updating…" : "Update password"}
        </Button>
      </form>
    </AuthCard>
  );
}
