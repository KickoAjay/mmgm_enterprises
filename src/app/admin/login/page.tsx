"use client";

import { useActionState } from "react";
import { adminSignInAction, type AdminActionState } from "@/lib/auth/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState<AdminActionState, FormData>(
    adminSignInAction,
    null,
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <div className="border border-border bg-background p-8">
        <span className="text-meta font-semibold tracking-[0.2em] text-primary uppercase">
          MMGM Enterprises
        </span>
        <h1 className="mt-2 font-serif text-2xl text-foreground">Admin Sign In</h1>

        <form action={formAction} className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          {state && "error" in state ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}

          <Button type="submit" disabled={isPending} className="mt-2 uppercase tracking-wide">
            {isPending ? "Signing in…" : "Sign In"}
          </Button>
        </form>
      </div>
    </main>
  );
}
