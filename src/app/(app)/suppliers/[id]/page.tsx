import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, StatTile, StatusBadge } from "@/components/ui";
import { AttachmentsPanel } from "@/components/attachments-panel";
import { formatEUR, formatDate, formatNumber } from "@/lib/utils/format";
import { ORDER_STATUS_LABELS, orderStatusColor } from "@/lib/utils/status";
import type { SupplierStats, PurchaseOrder } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function SupplierDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [{ data: supplier }, { data: stats }, { data: orders }] = await Promise.all([
    supabase.from("suppliers").select("*").eq("id", params.id).single(),
    supabase.from("supplier_stats").select("*").eq("supplier_id", params.id).maybeSingle(),
    supabase
      .from("purchase_orders")
      .select("*")
      .eq("supplier_id", params.id)
      .order("date_ordered", { ascending: false }),
  ]);

  if (!supplier) notFound();
  const s = stats as SupplierStats | null;

  return (
    <div>
      <PageHeader
        title={supplier.name}
        subtitle={supplier.company_name ?? undefined}
        action={
          <div className="flex gap-3">
            <Link href={`/orders/new?supplier_id=${supplier.id}`} className="btn-gold">
              New Order
            </Link>
            <Link href={`/suppliers/${supplier.id}/edit`} className="btn-secondary">
              Edit
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile label="Total Orders" value={String(s?.total_orders ?? 0)} />
        <StatTile label="Total Spend" value={formatEUR(s?.total_spend_eur ?? 0)} />
        <StatTile
          label="Avg Lead Time"
          value={s?.avg_lead_time_days ? `${formatNumber(s.avg_lead_time_days, 1)} days` : "-"}
        />
        <StatTile
          label="Open Problems"
          value={String(s?.open_problems ?? 0)}
          tone={s && s.open_problems > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="font-semibold mb-3">Contact Details</h3>
            <dl className="grid sm:grid-cols-2 gap-3 text-sm">
              <Detail label="Contact Person" value={supplier.contact_person} />
              <Detail label="Phone" value={supplier.phone} />
              <Detail label="WeChat" value={supplier.wechat} />
              <Detail label="WhatsApp" value={supplier.whatsapp} />
              <Detail label="1688" value={supplier.link_1688} isLink />
              <Detail label="Alibaba" value={supplier.alibaba_url} isLink />
            </dl>
            {supplier.address && (
              <div className="mt-3 pt-3 border-t border-line">
                <div className="label mb-1">Address</div>
                <p className="text-sm whitespace-pre-wrap">{supplier.address}</p>
              </div>
            )}
            {supplier.notes && (
              <div className="mt-3 pt-3 border-t border-line">
                <div className="label mb-1">Notes</div>
                <p className="text-sm whitespace-pre-wrap">{supplier.notes}</p>
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="font-semibold mb-3">Purchase Orders</h3>
            {!orders || orders.length === 0 ? (
              <p className="text-sm text-neutral-400">No orders yet from this supplier.</p>
            ) : (
              <div className="divide-y divide-line">
                {(orders as PurchaseOrder[]).map((o) => (
                  <Link
                    key={o.id}
                    href={`/orders/${o.id}`}
                    className="flex items-center justify-between py-3 hover:bg-surface -mx-2 px-2 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-sm">{o.order_number || "No order #"}</div>
                      <div className="text-xs text-neutral-500">{formatDate(o.date_ordered)}</div>
                    </div>
                    <StatusBadge label={ORDER_STATUS_LABELS[o.status]} className={orderStatusColor(o.status)} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <AttachmentsPanel entityType="supplier" entityId={supplier.id} />
      </div>
    </div>
  );
}

function Detail({ label, value, isLink }: { label: string; value: string | null; isLink?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs text-neutral-400">{label}</div>
      {isLink ? (
        <a href={value} target="_blank" rel="noreferrer" className="text-gold-dark hover:underline break-all">
          {value}
        </a>
      ) : (
        <div className="font-medium">{value}</div>
      )}
    </div>
  );
}
