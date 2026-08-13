"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveProductAction } from "@/features/products/admin-actions";

export function ArchiveProductButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("Archive this product? It will no longer be visible in the storefront.")) return;
    startTransition(async () => {
      await archiveProductAction(productId);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="text-meta text-destructive hover:underline"
    >
      {isPending ? "Archiving…" : "Archive"}
    </button>
  );
}
