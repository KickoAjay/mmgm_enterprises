import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getAdminProductDetail, getProductFormOptions } from "@/features/products/admin-queries";
import { ProductForm } from "@/components/admin/product-form";
import { ProductMediaManager } from "@/components/admin/product-media-manager";

export const metadata = {
  title: "Edit Product | MMGM Admin",
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  await requireRole(["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER"]);
  const { productId } = await params;
  const [product, options] = await Promise.all([
    getAdminProductDetail(productId),
    getProductFormOptions(),
  ]);
  if (!product) notFound();

  return (
    <div>
      <h1 className="font-serif text-2xl text-foreground">{product.name}</h1>

      <div className="mt-8 max-w-3xl">
        <ProductMediaManager
          productId={product.id}
          images={product.images.map((img) => ({
            id: img.id,
            url: img.url,
            isPrimary: img.isPrimary,
            sortOrder: img.sortOrder,
          }))}
          video={product.videos[0] ? { id: product.videos[0].id, url: product.videos[0].url } : null}
        />
      </div>

      <div className="mt-10 max-w-3xl border-t border-border pt-10">
        <ProductForm options={options} product={product} />
      </div>
    </div>
  );
}
