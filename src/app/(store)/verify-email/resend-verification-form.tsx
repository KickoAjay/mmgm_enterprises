"use client";

import { useActionState } from "react";
import {
  resendVerificationEmailAction,
  type AuthActionState,
} from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

export function ResendVerificationForm({ email }: { email: string }) {
  const [state, formAction, isPending] = useActionState<
    AuthActionState,
    FormData
  >(resendVerificationEmailAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="email" value={email} />
      <Button
        type="submit"
        variant="outline"
        disabled={isPending}
        className="uppercase tracking-wide"
      >
        {isPending ? "Resending…" : "Resend verification email"}
      </Button>
      {state && "success" in state ? (
        <p className="text-meta text-muted-foreground">
          Verification email resent.
        </p>
      ) : null}
      {state && "error" in state ? (
        <p className="text-meta text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
