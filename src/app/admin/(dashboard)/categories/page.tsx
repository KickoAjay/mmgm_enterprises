import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getAdminCategories } from "@/features/categories/admin-queries";
import { Button } from "@/components/ui/button";
import { ToggleCategoryActiveButton } from "@/components/admin/toggle-category-active-button";
import { DeleteCategoryButton } from "@/components/admin/delete-category-button";

export const metadata = {
  title: "Categories",
};

export default async function AdminCategoriesPage() {
  await requireRole(["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER"]);
  const categories = await getAdminCategories();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-foreground">Categories</h1>
        <Button asChild className="uppercase tracking-wide">
          <Link href="/admin/categories/new">Add Category</Link>
        </Button>
      </div>

      <div className="mt-6 overflow-x-auto border border-border bg-background">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-meta text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Sort Order</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-foreground">
                  <Link href={`/admin/categories/${c.id}`} className="hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.slug}</td>
                <td className="px-4 py-3 text-foreground">{c.productCount}</td>
                <td className="px-4 py-3 text-foreground">{c.sortOrder}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.isActive ? "Active" : "Inactive"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-4">
                    <ToggleCategoryActiveButton categoryId={c.id} isActive={c.isActive} />
                    {c.productCount === 0 ? (
                      <DeleteCategoryButton categoryId={c.id} />
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No categories yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
