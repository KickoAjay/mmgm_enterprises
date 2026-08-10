"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAction, type AuthActionState } from "@/lib/auth/actions";
import { AuthCard } from "@/components/store/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<
    AuthActionState,
    FormData
  >(signInAction, null);

  return (
    <AuthCard
      title="Log in"
      description="Welcome back to MMGM Enterprises."
      footer={
        <>
          New here?{" "}
          <Link
            href="/register"
            className="text-primary underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-meta text-muted-foreground underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
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

        <Button
          type="submit"
          disabled={isPending}
          className="mt-2 uppercase tracking-wide"
        >
          {isPending ? "Logging in…" : "Log in"}
        </Button>
      </form>
    </AuthCard>
  );
}
