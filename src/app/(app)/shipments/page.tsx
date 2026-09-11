import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/utils/format";
import { ORDER_STATUS_LABELS, orderStatusColor } from "@/lib/utils/status";

export const dynamic = "force-dynamic";

export default async function ShipmentsPage() {
  const supabase = createClient();
  const { data: shipments } = await supabase
    .from("shipments")
    .select("*, shipment_items(id)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Shipments"
        subtitle="Consolidated shipments from Shenzhen Xietong Warehouse to Ireland."
        action={
          <div className="flex gap-3">
            <a href="/api/export/csv?type=shipments" className="btn-secondary">
              Export CSV
            </a>
            <Link href="/shipments/new" className="btn-gold">
              <Plus size={16} /> New Shipment
            </Link>
          </div>
        }
      />

      {!shipments || shipments.length === 0 ? (
        <EmptyState
          title="No shipments yet"
          description="Create a shipment and consolidate purchase orders into it."
          actionHref="/shipments/new"
          actionLabel="New Shipment"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shipments.map((s: any) => (
            <Link key={s.id} href={`/shipments/${s.id}`} className="card block hover:border-gold transition-colors">
              <div className="flex items-start justify-between">
                <div className="font-semibold">{s.reference || "Unnamed shipment"}</div>
                <StatusBadge label={ORDER_STATUS_LABELS[s.status as keyof typeof ORDER_STATUS_LABELS]} className={orderStatusColor(s.status)} />
              </div>
              <div className="text-sm text-neutral-500 mt-1">{s.shipping_agent || "No agent set"}</div>
              <div className="text-xs text-neutral-400 mt-3">
                {s.shipment_items?.length ?? 0} order{(s.shipment_items?.length ?? 0) === 1 ? "" : "s"} consolidated
              </div>
              <div className="text-xs text-neutral-400 mt-1">
                Tracking: {s.tracking_number || "-"} · ETA {formatDate(s.estimated_arrival)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
