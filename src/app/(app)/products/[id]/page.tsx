import Link from "next/link";
import { notFound } from "next/navigation";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, StatTile } from "@/components/ui";
import { AttachmentsPanel } from "@/components/attachments-panel";
import { formatEUR, formatRMB, formatDate, formatNumber } from "@/lib/utils/format";
import type { ProductCostHistoryRow } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [{ data: product }, { data: history }] = await Promise.all([
    supabase.from("products").select("*, default_supplier:suppliers(id,name)").eq("id", params.id).single(),
    supabase
      .from("product_cost_history")
      .select("*")
      .eq("product_id", params.id)
      .order("date_ordered", { ascending: false }),
  ]);

  if (!product) notFound();

  const rows = (history ?? []) as ProductCostHistoryRow[];
  const latest = rows[0];
  const previous = rows[1];
  const trend =
    latest && previous && latest.unit_price_eur && previous.unit_price_eur
      ? latest.unit_price_eur - previous.unit_price_eur
      : 0;

  return (
    <div>
      <PageHeader
        title={product.name}
        subtitle={product.sku ? `SKU: ${product.sku}` : undefined}
        action={
          <Link href={`/products/${product.id}/edit`} className="btn-secondary">
            Edit
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile
          label="Latest Unit Price"
          value={latest ? formatEUR(latest.unit_price_eur) : "-"}
          hint={latest ? formatDate(latest.date_ordered) : undefined}
        />
        <StatTile
          label="Price Trend"
          value={
            trend === 0 ? "Stable" : trend > 0 ? `+${formatEUR(Math.abs(trend))}` : `-${formatEUR(Math.abs(trend))}`
          }
          tone={trend > 0 ? "warning" : "default"}
        />
        <StatTile label="Total Times Ordered" value={String(rows.length)} />
        <StatTile label="Default Supplier" value={product.default_supplier?.name ?? "-"} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="font-semibold mb-3">Cost History</h3>
            <p className="text-xs text-neutral-500 mb-3">
              Previous buying prices so you can spot if this supplier is raising or lowering
              prices over time.
            </p>
            {rows.length === 0 ? (
              <p className="text-sm text-neutral-400">
                No purchase history yet for this product.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase text-neutral-500 border-b border-line">
                    <tr>
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Supplier</th>
                      <th className="py-2 pr-4">Order</th>
                      <th className="py-2 pr-4 text-right">Qty</th>
                      <th className="py-2 pr-4 text-right">Unit Price</th>
                      <th className="py-2 pr-4 text-right">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {rows.map((r, i) => {
                      const prev = rows[i + 1];
                      const diff =
                        prev && r.unit_price_eur && prev.unit_price_eur
                          ? r.unit_price_eur - prev.unit_price_eur
                          : 0;
                      return (
                        <tr key={r.purchase_order_id}>
                          <td className="py-2 pr-4">{formatDate(r.date_ordered)}</td>
                          <td className="py-2 pr-4">{r.supplier_name}</td>
                          <td className="py-2 pr-4">
                            <Link href={`/orders/${r.purchase_order_id}`} className="text-gold-dark hover:underline">
                              {r.order_number || "View"}
                            </Link>
                          </td>
                          <td className="py-2 pr-4 text-right">{formatNumber(r.quantity)}</td>
                          <td className="py-2 pr-4 text-right">
                            {formatEUR(r.unit_price_eur)}
                            <div className="text-xs text-neutral-400">{formatRMB(r.unit_price_rmb)}</div>
                          </td>
                          <td className="py-2 pr-4 text-right">
                            {diff === 0 ? (
                              <Minus size={14} className="inline text-neutral-400" />
                            ) : diff > 0 ? (
                              <span className="text-red-600 inline-flex items-center gap-1">
                                <TrendingUp size={14} /> {formatEUR(Math.abs(diff))}
                              </span>
                            ) : (
                              <span className="text-green-600 inline-flex items-center gap-1">
                                <TrendingDown size={14} /> {formatEUR(Math.abs(diff))}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {product.description && (
            <div className="card">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm whitespace-pre-wrap">{product.description}</p>
            </div>
          )}
        </div>

        <AttachmentsPanel entityType="product" entityId={product.id} />
      </div>
    </div>
  );
}
