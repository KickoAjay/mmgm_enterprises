import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getAdminCategory } from "@/features/categories/admin-queries";
import { CategoryForm } from "@/components/admin/category-form";

export const metadata = {
  title: "Edit Category",
};

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  await requireRole(["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER"]);
  const { categoryId } = await params;
  const category = await getAdminCategory(categoryId);
  if (!category) notFound();

  return (
    <div>
      <h1 className="font-serif text-2xl text-foreground">Edit Category</h1>
      <div className="mt-8">
        <CategoryForm category={category} />
      </div>
    </div>
  );
}
