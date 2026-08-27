import { requireRole } from "@/lib/auth/session";
import { CategoryForm } from "@/components/admin/category-form";

export const metadata = {
  title: "Add Category",
};

export default async function NewCategoryPage() {
  await requireRole(["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER"]);

  return (
    <div>
      <h1 className="font-serif text-2xl text-foreground">Add Category</h1>
      <div className="mt-8">
        <CategoryForm />
      </div>
    </div>
  );
}
