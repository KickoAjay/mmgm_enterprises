"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/auth/session";
import { logAdminAction } from "@/lib/auth/audit";
import { categoryFormSchema } from "@/validations/admin-category";

export type CategoryActionState = { error: string } | { success: true } | null;

function firstIssueMessage(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Invalid input";
}

// Categories are catalog data in the same domain as products — same
// allowed-role list as the product admin actions (src/features/products/
// admin-actions.ts), not a separate permission tier.
const CATEGORY_ROLES = ["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER"] as const;

function parseCategoryForm(formData: FormData) {
  const field = (name: string) => formData.get(name) ?? undefined;
  return categoryFormSchema.safeParse({
    name: field("name"),
    slug: field("slug"),
    imageUrl: field("imageUrl"),
    sortOrder: field("sortOrder"),
    isActive: field("isActive"),
  });
}

export async function createCategoryAction(
  _prevState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const membership = await requireRole([...CATEGORY_ROLES]);
  const parsed = parseCategoryForm(formData);
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };
  const input = parsed.data;

  const supabase = await createClient();
  const { data: category, error } = await supabase
    .from("categories")
    .insert({
      name: input.name,
      slug: input.slug,
      image_url: input.imageUrl,
      sort_order: input.sortOrder,
      is_active: input.isActive === "on",
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return { error: "That slug is already in use" };
    return { error: "Could not create the category. Please try again." };
  }

  await logAdminAction({
    adminUserId: membership.id,
    action: "CATEGORY_CREATED",
    entityType: "categories",
    entityId: category.id,
  });

  redirect("/admin/categories");
}

export async function updateCategoryAction(
  _prevState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const membership = await requireRole([...CATEGORY_ROLES]);
  const categoryId = String(formData.get("categoryId") ?? "");
  if (!categoryId) return { error: "Missing category" };

  const parsed = parseCategoryForm(formData);
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };
  const input = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({
      name: input.name,
      slug: input.slug,
      image_url: input.imageUrl,
      sort_order: input.sortOrder,
      is_active: input.isActive === "on",
    })
    .eq("id", categoryId);
  if (error) {
    if (error.code === "23505") return { error: "That slug is already in use" };
    return { error: "Could not update the category. Please try again." };
  }

  await logAdminAction({
    adminUserId: membership.id,
    action: "CATEGORY_UPDATED",
    entityType: "categories",
    entityId: categoryId,
  });

  redirect("/admin/categories");
}

export async function toggleCategoryActiveAction(
  categoryId: string,
  isActive: boolean,
): Promise<void> {
  const membership = await requireRole([...CATEGORY_ROLES]);
  const supabase = await createClient();
  await supabase.from("categories").update({ is_active: isActive }).eq("id", categoryId);
  await logAdminAction({
    adminUserId: membership.id,
    action: isActive ? "CATEGORY_ACTIVATED" : "CATEGORY_DEACTIVATED",
    entityType: "categories",
    entityId: categoryId,
  });
}

export type DeleteCategoryResult = { success: true } | { error: string };

// A real DELETE, not a soft-delete like products — categories have no
// history to preserve the way a sold product's order_items do. products.
// category_id is ON DELETE RESTRICT, so Postgres itself refuses to delete
// a category still in use; caught here and turned into a clear message
// pointing at deactivation instead, rather than a raw constraint error.
export async function deleteCategoryAction(categoryId: string): Promise<DeleteCategoryResult> {
  const membership = await requireRole([...CATEGORY_ROLES]);
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", categoryId);
  if (error) {
    if (error.code === "23503") {
      return {
        error: "This category still has products assigned to it. Deactivate it instead, or move those products to another category first.",
      };
    }
    return { error: "Could not delete the category. Please try again." };
  }

  await logAdminAction({
    adminUserId: membership.id,
    action: "CATEGORY_DELETED",
    entityType: "categories",
    entityId: categoryId,
  });

  return { success: true };
}
