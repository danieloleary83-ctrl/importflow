"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Trash2, Link2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader, StatusBadge, StatTile } from "@/components/ui";
import { AttachmentsPanel } from "@/components/attachments-panel";
import { formatEUR, formatDate, formatNumber } from "@/lib/utils/format";
import { ORDER_STATUS_LABELS, ORDER_STATUS_LIST, orderStatusColor, COST_TYPE_LABELS } from "@/lib/utils/status";
import type { Shipment } from "@/lib/types/database";

const COST_TYPES = ["international_freight", "customs_duty", "import_vat", "other"];

export function ShipmentDetailClient({
  shipmentId,
  initialShipment,
}: {
  shipmentId: string;
  initialShipment: Shipment;
}) {
  const [shipment, setShipment] = useState(initialShipment);
  const [items, setItems] = useState<any[]>([]);
  const [costs, setCosts] = useState<any[]>([]);
  const [trackingUpdates, setTrackingUpdates] = useState<any[]>([]);
  const [savingStatus, setSavingStatus] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/shipments/${shipmentId}`);
    const json = await res.json();
    setShipment(json.data);
    setItems(json.items ?? []);
    setCosts(json.costs ?? []);
    setTrackingUpdates(json.trackingUpdates ?? []);
  }, [shipmentId]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(status: string) {
    setSavingStatus(true);
    await fetch(`/api/shipments/${shipmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
    setSavingStatus(false);
  }

  // Group shipment_items by purchase_order for display
  const poGroups = Object.values(
    items.reduce((acc: Record<string, any>, it) => {
      const poId = it.purchase_order.id;
      if (!acc[poId]) acc[poId] = { po: it.purchase_order, count: 0 };
      acc[poId].count += 1;
      return acc;
    }, {})
  ) as { po: any; count: number }[];

  async function unlinkOrder(poId: string) {
    if (!confirm("Remove this order from the shipment?")) return;
    await fetch(`/api/shipments/${shipmentId}/link-order?purchase_order_id=${poId}`, { method: "DELETE" });
    load();
  }

  async function deleteCost(id: string) {
    await fetch(`/api/costs/${id}`, { method: "DELETE" });
    load();
  }

  const totalCostsEur = costs.reduce((sum, c) => sum + (Number(c.amount_eur) || 0), 0);

  return (
    <div>
      <PageHeader
        title={shipment.reference || "Shipment"}
        subtitle={`${shipment.warehouse} · Mark: ${shipment.shipping_mark}`}
        action={
          <Link href={`/shipments/${shipmentId}/edit`} className="btn-secondary">
            Edit Details
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <StatusBadge label={ORDER_STATUS_LABELS[shipment.status]} className={orderStatusColor(shipment.status)} />
        <select
          className="input w-auto text-sm py-1.5"
          value={shipment.status}
          disabled={savingStatus}
          onChange={(e) => updateStatus(e.target.value)}
        >
          {ORDER_STATUS_LIST.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile label="Cartons" value={shipment.carton_count?.toString() ?? "-"} hint={shipment.carton_dimensions ?? undefined} />
        <StatTile label="Weight" value={shipment.gross_weight_kg ? `${formatNumber(shipment.gross_weight_kg, 1)} kg` : "-"} />
        <StatTile label="CBM" value={shipment.cbm ? formatNumber(shipment.cbm, 2) : "-"} />
        <StatTile label="ETA" value={formatDate(shipment.estimated_arrival)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Link2 size={16} /> Consolidated Purchase Orders
            </h3>
            {poGroups.length === 0 ? (
              <p className="text-sm text-neutral-400">No orders linked yet.</p>
            ) : (
              <div className="divide-y divide-line mb-3">
                {poGroups.map(({ po, count }) => (
                  <div key={po.id} className="flex items-center justify-between py-2 text-sm">
                    <Link href={`/orders/${po.id}`} className="hover:text-gold-dark">
                      <span className="font-medium">{po.order_number || "No order #"}</span>
                      <span className="text-neutral-500"> · {po.supplier?.name}</span>
                    </Link>
                    <button onClick={() => unlinkOrder(po.id)} className="text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <LinkOrderForm shipmentId={shipmentId} onLinked={load} />
          </div>

          <div className="card">
            <h3 className="font-semibold mb-3">Shipping &amp; Import Costs</h3>
            <p className="text-xs text-neutral-500 mb-3">
              International freight, customs duty and import VAT for this shipment. These get
              allocated across the consolidated orders on each order&apos;s landed cost panel.
            </p>
            {costs.length > 0 && (
              <div className="divide-y divide-line mb-3">
                {costs.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <div className="font-medium">{COST_TYPE_LABELS[c.cost_type]}</div>
                      {c.description && <div className="text-xs text-neutral-500">{c.description}</div>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{formatEUR(c.amount_eur)}</span>
                      <button onClick={() => deleteCost(c.id)} className="text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2 text-sm font-bold">
                  <span>Total</span>
                  <span>{formatEUR(totalCostsEur)}</span>
                </div>
              </div>
            )}
            <AddCostForm shipmentId={shipmentId} onAdded={load} />
          </div>

          <div className="card">
            <h3 className="font-semibold mb-3">Tracking Updates</h3>
            {trackingUpdates.length === 0 ? (
              <p className="text-sm text-neutral-400 mb-3">No tracking updates yet.</p>
            ) : (
              <div className="space-y-3 mb-3">
                {trackingUpdates.map((t) => (
                  <div key={t.id} className="text-sm border-l-2 border-gold pl-3">
                    <div className="font-medium">{t.status || t.location || "Update"}</div>
                    {t.note && <div className="text-neutral-500">{t.note}</div>}
                    <div className="text-xs text-neutral-400">
                      {formatDate(t.event_date)} · {t.source}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <AddTrackingForm shipmentId={shipmentId} onAdded={load} />
          </div>
        </div>

        <AttachmentsPanel entityType="shipment" entityId={shipmentId} />
      </div>
    </div>
  );
}

function LinkOrderForm({ shipmentId, onLinked }: { shipmentId: string; onLinked: () => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("purchase_orders")
      .select("id, order_number, supplier:suppliers(name)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders(data ?? []));
  }, []);

  async function submit() {
    if (!selected) return;
    setLoading(true);
    await fetch(`/api/shipments/${shipmentId}/link-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchase_order_id: selected }),
    });
    setLoading(false);
    setSelected("");
    onLinked();
  }

  return (
    <div className="flex gap-2">
      <select className="input text-sm" value={selected} onChange={(e) => setSelected(e.target.value)}>
        <option value="">Choose an order to consolidate...</option>
        {orders.map((o) => (
          <option key={o.id} value={o.id}>
            {o.order_number || "No order #"} · {o.supplier?.name}
          </option>
        ))}
      </select>
      <button onClick={submit} disabled={loading || !selected} className="btn-gold text-xs px-3 shrink-0">
        <Plus size={14} /> Link
      </button>
    </div>
  );
}

function AddCostForm({ shipmentId, onAdded }: { shipmentId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [costType, setCostType] = useState(COST_TYPES[0]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    const amt = parseFloat(amount) || 0;
    if (amt <= 0) return;
    setLoading(true);
    await fetch("/api/costs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shipment_id: shipmentId,
        cost_type: costType,
        amount: amt,
        currency: "EUR",
        amount_eur: amt,
      }),
    });
    setLoading(false);
    setAmount("");
    setOpen(false);
    onAdded();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary text-xs py-1.5 px-3">
        <Plus size={14} /> Add Cost
      </button>
    );
  }

  return (
    <div className="flex gap-2 items-end flex-wrap">
      <select className="input text-sm w-auto" value={costType} onChange={(e) => setCostType(e.target.value)}>
        {COST_TYPES.map((c) => (
          <option key={c} value={c}>
            {COST_TYPE_LABELS[c]}
          </option>
        ))}
      </select>
      <input
        type="number"
        step="0.01"
        className="input text-sm w-32"
        placeholder="Amount EUR"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={submit} disabled={loading} className="btn-gold text-xs py-2">
        Add
      </button>
    </div>
  );
}

function AddTrackingForm({ shipmentId, onAdded }: { shipmentId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!status && !note) return;
    setLoading(true);
    await fetch(`/api/shipments/${shipmentId}/tracking-updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    });
    setLoading(false);
    setStatus("");
    setNote("");
    setOpen(false);
    onAdded();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary text-xs py-1.5 px-3">
        <Plus size={14} /> Add Update
      </button>
    );
  }

  return (
    <div className="flex gap-2 flex-wrap items-end">
      <input className="input text-sm w-40" placeholder="Status / location" value={status} onChange={(e) => setStatus(e.target.value)} />
      <input className="input text-sm flex-1" placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} />
      <button onClick={submit} disabled={loading} className="btn-gold text-xs py-2">
        Add
      </button>
    </div>
  );
}
