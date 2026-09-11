import Link from "next/link";
import { AlertTriangle, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, StatTile, StatusBadge } from "@/components/ui";
import { formatEUR, formatDate } from "@/lib/utils/format";
import { ORDER_STATUS_LABELS, PROBLEM_TYPE_LABELS, orderStatusColor } from "@/lib/utils/status";
import type { OrderStatus } from "@/lib/types/database";

export const dynamic = "force-dynamic";

const IN_TRANSIT_STATUSES = ["shipped", "in_transit", "customs"];
const OPEN_ORDER_STATUSES_EXCLUDE = ["delivered", "cancelled"];

export default async function DashboardPage() {
  const supabase = createClient();

  const results = await Promise.all([
    supabase.from("purchase_orders").select("id, status, order_number, date_ordered, supplier:suppliers(name)"),
    supabase.from("purchase_order_items").select("line_total_eur, purchase_order_id, purchase_order:purchase_orders(date_ordered, status)"),
    supabase.from("shipments").select("id, reference, status, estimated_arrival, actual_arrival, date_delivered, tracking_number"),
    supabase
      .from("problems_claims")
      .select("id, type, description, status, date_reported, supplier:suppliers(name)")
      .in("status", ["open", "in_progress"]),
    supabase.from("costs").select("amount_eur, cost_type"),
  ]);

  const orders: any[] = results[0].data ?? [];
  const items: any[] = results[1].data ?? [];
  const shipments: any[] = results[2].data ?? [];
  const problems: any[] = results[3].data ?? [];
  const costs: any[] = results[4].data ?? [];

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  const openOrders = (orders ?? []).filter((o) => !OPEN_ORDER_STATUSES_EXCLUDE.includes(o.status));
  const waitingAtWarehouse = (orders ?? []).filter((o) => o.status === "at_china_warehouse");
  const inTransitShipments = (shipments ?? []).filter((s) => IN_TRANSIT_STATUSES.includes(s.status));
  const overdueShipments = (shipments ?? []).filter(
    (s) => s.estimated_arrival && new Date(s.estimated_arrival) < today && !s.actual_arrival && s.status !== "delivered" && s.status !== "cancelled"
  );
  const upcomingDeliveries = (shipments ?? [])
    .filter((s) => s.estimated_arrival && !s.actual_arrival && new Date(s.estimated_arrival) >= today)
    .sort((a, b) => new Date(a.estimated_arrival!).getTime() - new Date(b.estimated_arrival!).getTime())
    .slice(0, 5);

  let spendThisMonth = 0;
  let spendThisYear = 0;
  let stockValueInTransit = 0;
  for (const it of items ?? []) {
    const total = Number(it.line_total_eur) || 0;
    const po = it.purchase_order as any;
    if (po?.date_ordered) {
      const d = new Date(po.date_ordered);
      if (d >= startOfMonth) spendThisMonth += total;
      if (d >= startOfYear) spendThisYear += total;
    }
    if (po?.status && IN_TRANSIT_STATUSES.includes(po.status)) {
      stockValueInTransit += total;
    }
  }

  const shippingCosts = (costs ?? [])
    .filter((c) => ["international_freight", "china_domestic_shipping"].includes(c.cost_type))
    .reduce((sum, c) => sum + (Number(c.amount_eur) || 0), 0);

  const needsAttention = [
    ...overdueShipments.map((s) => ({
      key: `ship-${s.id}`,
      href: `/shipments/${s.id}`,
      title: `Overdue: ${s.reference || "Shipment"}`,
      detail: `Expected ${formatDate(s.estimated_arrival)} - hasn't arrived yet`,
    })),
    ...(problems ?? []).map((p: any) => ({
      key: `problem-${p.id}`,
      href: `/problems/${p.id}`,
      title: PROBLEM_TYPE_LABELS[p.type] || p.type,
      detail: `${p.supplier?.name || "Unknown supplier"} - reported ${formatDate(p.date_reported)}`,
    })),
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Inch Autos - China Purchase Tracker"
        action={
          <Link href="/ai-import" className="btn-gold">
            <Sparkles size={16} /> AI Import
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile label="Open Orders" value={String(openOrders.length)} />
        <StatTile label="At Warehouse" value={String(waitingAtWarehouse.length)} />
        <StatTile label="Shipments In Transit" value={String(inTransitShipments.length)} />
        <StatTile
          label="Overdue Shipments"
          value={String(overdueShipments.length)}
          tone={overdueShipments.length > 0 ? "warning" : "default"}
        />
        <StatTile label="Spend This Month" value={formatEUR(spendThisMonth)} tone="gold" />
        <StatTile label="Spend This Year" value={formatEUR(spendThisYear)} />
        <StatTile label="Total Shipping Costs" value={formatEUR(shippingCosts)} />
        <StatTile label="Stock Value In Transit" value={formatEUR(stockValueInTransit)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card border-red-200">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-700">
              <AlertTriangle size={18} /> Needs Attention
            </h3>
            {needsAttention.length === 0 ? (
              <p className="text-sm text-neutral-400">Nothing urgent right now.</p>
            ) : (
              <div className="divide-y divide-line">
                {needsAttention.map((n) => (
                  <Link key={n.key} href={n.href} className="flex items-center justify-between py-2.5 hover:text-gold-dark">
                    <div>
                      <div className="font-medium text-sm">{n.title}</div>
                      <div className="text-xs text-neutral-500">{n.detail}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-3">Upcoming Deliveries</h3>
          {upcomingDeliveries.length === 0 ? (
            <p className="text-sm text-neutral-400">Nothing scheduled.</p>
          ) : (
            <div className="divide-y divide-line">
              {upcomingDeliveries.map((s) => (
                <Link key={s.id} href={`/shipments/${s.id}`} className="flex items-center justify-between py-2.5 hover:text-gold-dark">
                  <div>
                    <div className="font-medium text-sm">{s.reference || "Shipment"}</div>
                    <div className="text-xs text-neutral-500">{formatDate(s.estimated_arrival)}</div>
                  </div>
                  <StatusBadge label={ORDER_STATUS_LABELS[s.status as OrderStatus]} className={orderStatusColor(s.status)} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
