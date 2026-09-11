import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/utils/format";
import { ORDER_STATUS_LABELS, ORDER_STATUS_LIST, orderStatusColor } from "@/lib/utils/status";

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createClient();
  let query = supabase
    .from("purchase_orders")
    .select("*, supplier:suppliers(id,name)")
    .order("date_ordered", { ascending: false, nullsFirst: false });

  if (searchParams.status) query = query.eq("status", searchParams.status);

  const { data: orders } = await query;

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        subtitle="Everything you've ordered from suppliers."
        action={
          <div className="flex gap-3">
            <a href="/api/export/csv?type=orders" className="btn-secondary">
              Export CSV
            </a>
            <Link href="/orders/new" className="btn-gold">
              <Plus size={16} /> New Order
            </Link>
          </div>
        }
      />

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        <Link
          href="/orders"
          className={`badge shrink-0 ${!searchParams.status ? "bg-ink text-white" : "bg-white border border-line text-neutral-600"}`}
        >
          All
        </Link>
        {ORDER_STATUS_LIST.map((s) => (
          <Link
            key={s}
            href={`/orders?status=${s}`}
            className={`badge shrink-0 ${searchParams.status === s ? "bg-ink text-white" : "bg-white border border-line text-neutral-600"}`}
          >
            {ORDER_STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {!orders || orders.length === 0 ? (
        <EmptyState
          title="No purchase orders yet"
          description="Create one manually, or use AI Import to create it from a screenshot."
          actionHref="/orders/new"
          actionLabel="New Order"
        />
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Date Ordered</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o: any) => (
                <tr key={o.id} className="hover:bg-surface">
                  <td className="px-4 py-3">
                    <Link href={`/orders/${o.id}`} className="font-medium hover:text-gold-dark">
                      {o.order_number || "No order #"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{o.supplier?.name || "-"}</td>
                  <td className="px-4 py-3 text-neutral-500">{formatDate(o.date_ordered)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={ORDER_STATUS_LABELS[o.status as keyof typeof ORDER_STATUS_LABELS]} className={orderStatusColor(o.status)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
