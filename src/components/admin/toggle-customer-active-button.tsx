"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCustomerActiveAction } from "@/features/customers/actions";

export function ToggleCustomerActiveButton({
  userId,
  isActive,
}: {
  userId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const confirmMessage = isActive
      ? "Disable this account? They won't be able to log in."
      : "Re-enable this account?";
    if (!confirm(confirmMessage)) return;
    startTransition(async () => {
      await setCustomerActiveAction(userId, !isActive);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`text-meta hover:underline ${isActive ? "text-destructive" : "text-primary"}`}
    >
      {isPending ? "Saving…" : isActive ? "Disable" : "Enable"}
    </button>
  );
}
