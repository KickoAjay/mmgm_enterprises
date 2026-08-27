"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCategoryAction } from "@/features/categories/admin-actions";

export function DeleteCategoryButton({ categoryId }: { categoryId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!confirm("Delete this category permanently? This cannot be undone.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteCategoryAction(categoryId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="text-meta text-destructive hover:underline"
      >
        {isPending ? "Deleting…" : "Delete"}
      </button>
      {error ? <p className="text-meta max-w-48 text-right text-destructive">{error}</p> : null}
    </div>
  );
}
