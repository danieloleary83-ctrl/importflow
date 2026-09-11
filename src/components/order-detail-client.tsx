"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Trash2, AlertTriangle, Calculator } from "lucide-react";
import { PageHeader, StatusBadge, StatTile } from "@/components/ui";
import { AttachmentsPanel } from "@/components/attachments-panel";
import { formatEUR, formatRMB, formatDate, formatNumber } from "@/lib/utils/format";
import { ORDER_STATUS_LABELS, ORDER_STATUS_LIST, orderStatusColor, COST_TYPE_LABELS } from "@/lib/utils/status";
import type { CostAllocationMethod, PurchaseOrder } from "@/lib/types/database";

const COST_TYPES = Object.keys(COST_TYPE_LABELS);
const ALLOCATION_METHODS: CostAllocationMethod[] = ["value", "quantity", "weight", "cbm"];

export function OrderDetailClient({
  orderId,
  initialOrder,
}: {
  orderId: string;
  initialOrder: PurchaseOrder & { supplier: { id: string; name: string; phone: string | null; wechat: string | null } };
}) {
  const [order, setOrder] = useState(initialOrder);
  const [items, setItems] = useState<any[]>([]);
  const [costs, setCosts] = useState<any[]>([]);
  const [shipmentLinks, setShipmentLinks] = useState<any[]>([]);
  const [landed, setLanded] = useState<any>(null);
  const [method, setMethod] = useState<CostAllocationMethod>("value");
  const [savingStatus, setSavingStatus] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/purchase-orders/${orderId}`);
    const json = await res.json();
    setOrder(json.data);
    setItems(json.items ?? []);
    setCosts(json.costs ?? []);
    setShipmentLinks(json.shipmentLinks ?? []);
  }, [orderId]);

  const loadLanded = useCallback(async () => {
    const res = await fetch(`/api/purchase-orders/${orderId}/landed-cost?method=${method}`);
    const json = await res.json();
    setLanded(json);
  }, [orderId, method]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadLanded();
  }, [loadLanded]);

  async function updateStatus(status: string) {
    setSavingStatus(true);
    await fetch(`/api/purchase-orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
    setSavingStatus(false);
  }

  async function deleteItem(id: string) {
    if (!confirm("Remove this item?")) return;
    await fetch(`/api/purchase-orders/${orderId}/items/${id}`, { method: "DELETE" });
    load();
    loadLanded();
  }

  async function deleteCost(id: string) {
    if (!confirm("Remove this cost?")) return;
    await fetch(`/api/costs/${id}`, { method: "DELETE" });
    load();
    loadLanded();
  }

  const itemsTotalEur = items.reduce((sum, i) => sum + (Number(i.line_total_eur) || 0), 0);
  const itemsTotalRmb = items.reduce((sum, i) => sum + (Number(i.line_total_rmb) || 0), 0);

  return (
    <div>
      <PageHeader
        title={order.order_number || "Purchase Order"}
        subtitle={`Supplier: ${order.supplier?.name ?? ""}`}
        action={
          <div className="flex gap-3">
            <Link href={`/problems/new?purchase_order_id=${orderId}`} className="btn-secondary">
              <AlertTriangle size={16} /> Report a Problem
            </Link>
            <Link href={order.supplier ? `/suppliers/${order.supplier.id}` : "#"} className="btn-secondary">
              View Supplier
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <StatusBadge label={ORDER_STATUS_LABELS[order.status]} className={orderStatusColor(order.status)} />
        <select
          className="input w-auto text-sm py-1.5"
          value={order.status}
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
        <StatTile label="Items Total" value={formatEUR(itemsTotalEur)} hint={formatRMB(itemsTotalRmb)} />
        <StatTile label="Date Ordered" value={formatDate(order.date_ordered)} />
        <StatTile label="Exchange Rate" value={order.exchange_rate ? formatNumber(order.exchange_rate, 4) : "-"} />
        <StatTile label="At Warehouse" value={formatDate(order.date_received_at_warehouse)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="font-semibold mb-3">Items</h3>
            {items.length === 0 ? (
              <p className="text-sm text-neutral-400">No items yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase text-neutral-500 border-b border-line">
                    <tr>
                      <th className="py-2 pr-3">Product</th>
                      <th className="py-2 pr-3 text-right">Qty</th>
                      <th className="py-2 pr-3 text-right">Unit Price</th>
                      <th className="py-2 pr-3 text-right">Line Total</th>
                      <th className="py-2 pr-1"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {items.map((it) => (
                      <tr key={it.id}>
                        <td className="py-2 pr-3">
                          {it.product ? (
                            <Link href={`/products/${it.product.id}`} className="text-gold-dark hover:underline">
                              {it.product.name}
                            </Link>
                          ) : (
                            it.description || "-"
                          )}
                        </td>
                        <td className="py-2 pr-3 text-right">{formatNumber(it.quantity)}</td>
                        <td className="py-2 pr-3 text-right">
                          {formatEUR(it.unit_price_eur)}
                          <div className="text-xs text-neutral-400">{formatRMB(it.unit_price_rmb)}</div>
                        </td>
                        <td className="py-2 pr-3 text-right font-medium">{formatEUR(it.line_total_eur)}</td>
                        <td className="py-2 pr-1 text-right">
                          <button onClick={() => deleteItem(it.id)} className="text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <AddItemForm orderId={orderId} exchangeRate={order.exchange_rate} onAdded={() => { load(); loadLanded(); }} />
          </div>

          <div className="card">
            <h3 className="font-semibold mb-3">Costs</h3>
            <p className="text-xs text-neutral-500 mb-3">
              China domestic shipping, customs, VAT and other charges tied directly to this order.
            </p>
            {costs.length === 0 ? (
              <p className="text-sm text-neutral-400">No costs recorded yet.</p>
            ) : (
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
              </div>
            )}
            <AddCostForm orderId={orderId} onAdded={() => { load(); loadLanded(); }} />
          </div>

          {shipmentLinks.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-3">Shipments</h3>
              <div className="divide-y divide-line">
                {shipmentLinks.map((sl) => (
                  <Link
                    key={sl.id}
                    href={`/shipments/${sl.shipment.id}`}
                    className="flex items-center justify-between py-2 text-sm hover:text-gold-dark"
                  >
                    <span>{sl.shipment.reference || "Unnamed shipment"}</span>
                    <span className="text-neutral-500">{sl.shipment.tracking_number || "-"}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calculator size={16} /> True Landed Cost
            </h3>
            <div className="mb-3">
              <label className="label">Allocate shipping/customs by</label>
              <select className="input text-sm" value={method} onChange={(e) => setMethod(e.target.value as CostAllocationMethod)}>
                {ALLOCATION_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m[0].toUpperCase() + m.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            {landed?.totals && (
              <div className="text-sm space-y-1 mb-3 pb-3 border-b border-line">
                <Row label="Items" value={formatEUR(landed.totals.items_total_eur)} />
                <Row label="Direct costs" value={formatEUR(landed.totals.direct_costs_eur)} />
                <Row label="Allocated shipping" value={formatEUR(landed.totals.allocated_shipping_eur)} />
                <Row label="Landed total" value={formatEUR(landed.totals.landed_total_eur)} strong />
              </div>
            )}
            {landed?.data?.length > 0 ? (
              <div className="space-y-2">
                {landed.data.map((r: any) => {
                  const item = items.find((i) => i.id === r.purchase_order_item_id);
                  return (
                    <div key={r.purchase_order_item_id} className="text-sm flex items-center justify-between">
                      <span className="truncate mr-2">{item?.product?.name || item?.description || "Item"}</span>
                      <span className="font-semibold shrink-0">{formatEUR(r.landed_cost_per_unit_eur)}/unit</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-neutral-400">Add items to see landed cost.</p>
            )}
          </div>

          <AttachmentsPanel entityType="purchase_order" entityId={orderId} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${strong ? "font-bold text-ink" : "text-neutral-500"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function AddItemForm({
  orderId,
  exchangeRate,
  onAdded,
}: {
  orderId: string;
  exchangeRate: number | null;
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPriceRmb, setUnitPriceRmb] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!description) return;
    setLoading(true);
    const rmb = parseFloat(unitPriceRmb) || 0;
    await fetch(`/api/purchase-orders/${orderId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        quantity: parseFloat(quantity) || 0,
        unit_price_rmb: rmb,
        unit_price_eur: exchangeRate ? rmb / exchangeRate : null,
      }),
    });
    setLoading(false);
    setDescription("");
    setQuantity("1");
    setUnitPriceRmb("");
    setOpen(false);
    onAdded();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary text-xs py-1.5 px-3 mt-3">
        <Plus size={14} /> Add Item
      </button>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-2 mt-3 items-end">
      <input
        className="input text-sm col-span-6"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        type="number"
        className="input text-sm col-span-2"
        placeholder="Qty"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
      />
      <input
        type="number"
        step="0.01"
        className="input text-sm col-span-3"
        placeholder="Unit RMB"
        value={unitPriceRmb}
        onChange={(e) => setUnitPriceRmb(e.target.value)}
      />
      <button onClick={submit} disabled={loading} className="btn-gold col-span-1 text-xs py-2">
        Add
      </button>
    </div>
  );
}

function AddCostForm({ orderId, onAdded }: { orderId: string; onAdded: () => void }) {
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
        purchase_order_id: orderId,
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
