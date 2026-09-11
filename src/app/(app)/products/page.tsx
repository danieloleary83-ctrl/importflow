import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const supabase = createClient();
  let query = supabase
    .from("products")
    .select("*, default_supplier:suppliers(id,name)")
    .order("name");
  if (searchParams.q) {
    query = query.or(`name.ilike.%${searchParams.q}%,sku.ilike.%${searchParams.q}%`);
  }
  const { data: products } = await query;

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Every product you buy, with SKU and default supplier."
        action={
          <div className="flex gap-3">
            <a href="/api/export/csv?type=products" className="btn-secondary">
              Export CSV
            </a>
            <Link href="/products/new" className="btn-gold">
              <Plus size={16} /> Add Product
            </Link>
          </div>
        }
      />

      <form className="mb-5">
        <input
          type="text"
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search products by name or SKU..."
          className="input max-w-md"
        />
      </form>

      {!products || products.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Add a product, or let AI Import create one automatically from an order screenshot."
          actionHref="/products/new"
          actionLabel="Add Product"
        />
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Default Supplier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p: any) => (
                <tr key={p.id} className="hover:bg-surface">
                  <td className="px-4 py-3">
                    <Link href={`/products/${p.id}`} className="font-medium hover:text-gold-dark">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{p.sku || "-"}</td>
                  <td className="px-4 py-3 text-neutral-500">{p.category || "-"}</td>
                  <td className="px-4 py-3 text-neutral-500">{p.default_supplier?.name || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
