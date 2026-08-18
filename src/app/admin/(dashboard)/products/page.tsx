import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getAdminProducts } from "@/features/products/admin-queries";
import { formatINR } from "@/features/products/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArchiveProductButton } from "@/components/admin/archive-product-button";

export const metadata = {
  title: "Products",
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireRole(["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER", "INVENTORY_MANAGER"]);
  const { q } = await searchParams;
  const products = await getAdminProducts(q);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-foreground">Products</h1>
        <Button asChild className="uppercase tracking-wide">
          <Link href="/admin/products/new">Add Product</Link>
        </Button>
      </div>

      <form className="mt-6" action="/admin/products">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search by name or SKU"
          className="max-w-xs"
        />
      </form>

      <div className="mt-6 overflow-x-auto border border-border bg-background">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-meta text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-foreground">
                  <Link href={`/admin/products/${p.id}`} className="hover:underline">
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.sku}</td>
                <td className="px-4 py-3 text-foreground">{formatINR(p.sellingPrice)}</td>
                <td className="px-4 py-3 text-foreground">{p.stockQuantity ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.status}</td>
                <td className="px-4 py-3">
                  {p.status !== "ARCHIVED" ? <ArchiveProductButton productId={p.id} /> : null}
                </td>
              </tr>
            ))}
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No products found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
