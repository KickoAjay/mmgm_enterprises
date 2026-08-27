"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleCategoryActiveAction } from "@/features/categories/admin-actions";

export function ToggleCategoryActiveButton({
  categoryId,
  isActive,
}: {
  categoryId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const confirmMessage = isActive
      ? "Deactivate this category? It will no longer appear in the storefront."
      : "Reactivate this category?";
    if (!confirm(confirmMessage)) return;
    startTransition(async () => {
      await toggleCategoryActiveAction(categoryId, !isActive);
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
      {isPending ? "Saving…" : isActive ? "Deactivate" : "Activate"}
    </button>
  );
}
