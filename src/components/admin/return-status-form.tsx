"use client";

import { useActionState } from "react";
import { updateReturnStatusAction, type ReturnActionState } from "@/features/returns/admin-actions";
import {
  RETURN_STATUS_LABELS,
  getAllowedReturnTransitions,
  type ReturnStatus,
} from "@/features/returns/status";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function ReturnStatusForm({
  returnId,
  currentStatus,
  adminNote,
}: {
  returnId: string;
  currentStatus: string;
  adminNote: string | null;
}) {
  const [state, formAction, isPending] = useActionState<ReturnActionState, FormData>(
    updateReturnStatusAction,
    null,
  );
  const nextStatuses = getAllowedReturnTransitions(currentStatus);

  if (nextStatuses.length === 0) {
    return <p className="text-meta text-muted-foreground">No further actions available.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="returnId" value={returnId} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="status">Action</Label>
        <select
          id="status"
          name="status"
          required
          defaultValue=""
          className="border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          <option value="" disabled>
            Choose an action
          </option>
          {nextStatuses.map((status: ReturnStatus) => (
            <option key={status} value={status}>
              {RETURN_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="adminNote">Note to customer (optional)</Label>
        <textarea
          id="adminNote"
          name="adminNote"
          rows={3}
          defaultValue={adminNote ?? ""}
          className="border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>

      {state && "error" in state ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state && "success" in state ? <p className="text-sm text-foreground">Saved.</p> : null}

      <Button type="submit" disabled={isPending} className="w-fit uppercase tracking-wide">
        {isPending ? "Saving…" : "Apply"}
      </Button>
    </form>
  );
}
