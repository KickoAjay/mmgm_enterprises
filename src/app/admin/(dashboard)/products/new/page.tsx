import { requireRole } from "@/lib/auth/session";
import { getProductFormOptions } from "@/features/products/admin-queries";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = {
  title: "Add Product",
};

export default async function NewProductPage() {
  await requireRole(["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER"]);
  const options = await getProductFormOptions();

  return (
    <div>
      <h1 className="font-serif text-2xl text-foreground">Add Product</h1>
      <div className="mt-8 max-w-3xl">
        <ProductForm options={options} />
      </div>
    </div>
  );
}
