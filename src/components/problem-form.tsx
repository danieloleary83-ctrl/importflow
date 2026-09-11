"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PROBLEM_TYPE_LABELS } from "@/lib/utils/status";

const TYPES = Object.keys(PROBLEM_TYPE_LABELS);

export function ProblemForm({
  defaultPurchaseOrderId,
  defaultShipmentId,
}: {
  defaultPurchaseOrderId?: string;
  defaultShipmentId?: string;
}) {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [type, setType] = useState(TYPES[0]);
  const [purchaseOrderId, setPurchaseOrderId] = useState(defaultPurchaseOrderId ?? "");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("purchase_orders")
      .select("id, order_number, supplier:suppliers(name)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders(data ?? []));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      setError("Please describe what happened");
      return;
    }
    setLoading(true);
    setError(null);

    const res = await fetch("/api/problems", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        description,
        purchase_order_id: purchaseOrderId || null,
        shipment_id: defaultShipmentId || null,
      }),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error || "Something went wrong");
      return;
    }

    router.push(`/problems/${json.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 max-w-xl">
      <div>
        <label className="label">Type of Problem</label>
        <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {PROBLEM_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Related Order</label>
        <select className="input" value={purchaseOrderId} onChange={(e) => setPurchaseOrderId(e.target.value)}>
          <option value="">None</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.order_number || "No order #"} · {o.supplier?.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">What happened?</label>
        <textarea
          className="input"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the issue in detail..."
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-gold">
          {loading ? "Saving..." : "Report Problem"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
