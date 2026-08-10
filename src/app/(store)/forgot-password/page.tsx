"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  requestPasswordResetAction,
  type AuthActionState,
} from "@/lib/auth/actions";
import { AuthCard } from "@/components/store/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState<
    AuthActionState,
    FormData
  >(requestPasswordResetAction, null);

  if (state && "success" in state) {
    return (
      <AuthCard title="Check your email">
        <p className="text-sm text-muted-foreground">
          If an account exists for that email address, we&apos;ve sent a link to
          reset your password.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-primary underline-offset-4 hover:underline"
        >
          Back to log in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email and we'll send you a reset link."
      footer={
        <Link
          href="/login"
          className="text-primary underline-offset-4 hover:underline"
        >
          Back to log in
        </Link>
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

        {state && "error" in state ? (
          <p className="text-sm text-destructive">{state.error}</p>
        ) : null}

        <Button
          type="submit"
          disabled={isPending}
          className="mt-2 uppercase tracking-wide"
        >
          {isPending ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </AuthCard>
  );
}
