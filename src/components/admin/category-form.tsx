"use client";

import { useActionState, useState } from "react";
import {
  createCategoryAction,
  updateCategoryAction,
  type CategoryActionState,
} from "@/features/categories/admin-actions";
import type { AdminCategory } from "@/features/categories/admin-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CategoryForm({ category }: { category?: AdminCategory }) {
  const isEdit = Boolean(category);
  const action = isEdit ? updateCategoryAction : createCategoryAction;
  const [state, formAction, isPending] = useActionState<CategoryActionState, FormData>(
    action,
    null,
  );

  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      {isEdit && category ? (
        <input type="hidden" name="categoryId" value={category.id} />
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          required
        />
        <p className="text-meta text-muted-foreground">
          Used in the storefront URL — /shop?category={slug || "…"}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input
          id="imageUrl"
          name="imageUrl"
          type="url"
          defaultValue={category?.imageUrl ?? ""}
          placeholder="https://…"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sortOrder">Sort Order</Label>
        <Input
          id="sortOrder"
          name="sortOrder"
          type="number"
          defaultValue={category?.sortOrder ?? 0}
        />
        <p className="text-meta text-muted-foreground">
          Lower numbers appear first in Shop by Category / Collections.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={category?.isActive ?? true}
          className="size-4"
        />
        Active (visible in the storefront)
      </label>

      {state && "error" in state ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={isPending} className="mt-2 w-fit uppercase tracking-wide">
        {isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Category"}
      </Button>
    </form>
  );
}
