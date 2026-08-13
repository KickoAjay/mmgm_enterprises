"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setAdminActiveAction } from "@/lib/auth/admin-actions";

export function ToggleAdminActiveButton({
  adminUserId,
  isActive,
}: {
  adminUserId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await setAdminActiveAction(adminUserId, !isActive);
          router.refresh();
        })
      }
      className={`text-meta hover:underline ${isActive ? "text-destructive" : "text-primary"}`}
    >
      {isPending ? "Saving…" : isActive ? "Deactivate" : "Activate"}
    </button>
  );
}
