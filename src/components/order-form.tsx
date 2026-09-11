"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ORDER_STATUS_LABELS, ORDER_STATUS_LIST } from "@/lib/utils/status";
import type { Product, Supplier } from "@/lib/types/database";

interface ItemRow {
  product_id: string;
  description: string;
  quantity: string;
  unit_price_rmb: string;
}

export function OrderForm({ defaultSupplierId }: { defaultSupplierId?: string }) {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [header, setHeader] = useState({
    order_number: "",
    supplier_id: defaultSupplierId ?? "",
    status: "ordered",
    exchange_rate: "",
    date_ordered: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const [items, setItems] = useState<ItemRow[]>([
    { product_id: "", description: "", quantity: "1", unit_price_rmb: "" },
  ]);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("suppliers").select("*").order("name").then(({ data }) => setSuppliers(data ?? []));
    supabase.from("products").select("*").order("name").then(({ data }) => setProducts(data ?? []));
  }, []);

  function updateItem(index: number, patch: Partial<ItemRow>) {
    setItems((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addItem() {
    setItems((rows) => [...rows, { product_id: "", description: "", quantity: "1", unit_price_rmb: "" }]);
  }

  function removeItem(index: number) {
    setItems((rows) => rows.filter((_, i) => i !== index));
  }

  const rate = parseFloat(header.exchange_rate) || 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!header.supplier_id) {
      setError("Please choose a supplier");
      return;
    }
    setLoading(true);
    setError(null);

    const payload = {
      ...header,
      exchange_rate: header.exchange_rate ? parseFloat(header.exchange_rate) : null,
      items: items
        .filter((it) => it.description || it.product_id)
        .map((it) => {
          const unitPriceRmb = parseFloat(it.unit_price_rmb) || 0;
          return {
            product_id: it.product_id || null,
            description: it.description,
            quantity: parseFloat(it.quantity) || 0,
            unit_price_rmb: unitPriceRmb,
            unit_price_eur: rate > 0 ? Math.round((unitPriceRmb / rate) * 10000) / 10000 : null,
          };
        }),
    };

    const res = await fetch("/api/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error || "Something went wrong");
      return;
    }

    router.push(`/orders/${json.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="card grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Supplier *</label>
          <select
            className="input"
            value={header.supplier_id}
            onChange={(e) => setHeader((h) => ({ ...h, supplier_id: e.target.value }))}
          >
            <option value="">Select supplier...</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Order Number</label>
          <input
            className="input"
            value={header.order_number}
            onChange={(e) => setHeader((h) => ({ ...h, order_number: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Status</label>
          <select
            className="input"
            value={header.status}
            onChange={(e) => setHeader((h) => ({ ...h, status: e.target.value }))}
          >
            {ORDER_STATUS_LIST.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Date Ordered</label>
          <input
            type="date"
            className="input"
            value={header.date_ordered}
            onChange={(e) => setHeader((h) => ({ ...h, date_ordered: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Exchange Rate (RMB per 1 EUR)</label>
          <input
            type="number"
            step="0.0001"
            className="input"
            placeholder="e.g. 7.85"
            value={header.exchange_rate}
            onChange={(e) => setHeader((h) => ({ ...h, exchange_rate: e.target.value }))}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Notes</label>
          <textarea
            className="input"
            rows={2}
            value={header.notes}
            onChange={(e) => setHeader((h) => ({ ...h, notes: e.target.value }))}
          />
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Items</h3>
          <button type="button" onClick={addItem} className="btn-secondary text-xs py-1.5 px-3">
            <Plus size={14} /> Add Item
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item, i) => {
            const unitEur = rate > 0 ? (parseFloat(item.unit_price_rmb) || 0) / rate : 0;
            const lineTotalEur = unitEur * (parseFloat(item.quantity) || 0);
            return (
              <div key={i} className="grid grid-cols-12 gap-2 items-start border-b border-line pb-3 last:border-0">
                <div className="col-span-12 sm:col-span-4">
                  <select
                    className="input text-sm"
                    value={item.product_id}
                    onChange={(e) => {
                      const p = products.find((pp) => pp.id === e.target.value);
                      updateItem(i, { product_id: e.target.value, description: p ? p.name : item.description });
                    }}
                  >
                    <option value="">Free text / new product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <input
                    className="input text-sm mt-1.5"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(i, { description: e.target.value })}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <label className="text-[10px] text-neutral-400">Quantity</label>
                  <input
                    type="number"
                    className="input text-sm"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, { quantity: e.target.value })}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <label className="text-[10px] text-neutral-400">Unit Price (RMB)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input text-sm"
                    value={item.unit_price_rmb}
                    onChange={(e) => updateItem(i, { unit_price_rmb: e.target.value })}
                  />
                </div>
                <div className="col-span-3 sm:col-span-3 text-sm pt-6 text-neutral-500">
                  {rate > 0 ? `€${lineTotalEur.toFixed(2)} total` : "Set exchange rate"}
                </div>
                <div className="col-span-1 pt-5">
                  <button type="button" onClick={() => removeItem(i)} className="text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-gold">
          {loading ? "Saving..." : "Create Order"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
