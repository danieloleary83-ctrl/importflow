"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Shipment } from "@/lib/types/database";

export function ShipmentForm({ shipment }: { shipment?: Shipment }) {
  const router = useRouter();
  const [values, setValues] = useState({
    reference: shipment?.reference ?? "",
    shipping_agent: shipment?.shipping_agent ?? "",
    shipping_method: shipment?.shipping_method ?? "",
    tracking_number: shipment?.tracking_number ?? "",
    carton_count: shipment?.carton_count?.toString() ?? "",
    carton_dimensions: shipment?.carton_dimensions ?? "",
    gross_weight_kg: shipment?.gross_weight_kg?.toString() ?? "",
    cbm: shipment?.cbm?.toString() ?? "",
    date_shipped_from_china: shipment?.date_shipped_from_china ?? "",
    estimated_arrival: shipment?.estimated_arrival ?? "",
    notes: shipment?.notes ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url = shipment ? `/api/shipments/${shipment.id}` : "/api/shipments";
    const method = shipment ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error || "Something went wrong");
      return;
    }

    router.push(`/shipments/${json.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 max-w-2xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Reference" value={values.reference} onChange={(v) => setValues((s) => ({ ...s, reference: v }))} />
        <Field label="Shipping Agent" value={values.shipping_agent} onChange={(v) => setValues((s) => ({ ...s, shipping_agent: v }))} />
        <Field label="Shipping Method" value={values.shipping_method} onChange={(v) => setValues((s) => ({ ...s, shipping_method: v }))} placeholder="Sea freight, Air freight..." />
        <Field label="Tracking Number" value={values.tracking_number} onChange={(v) => setValues((s) => ({ ...s, tracking_number: v }))} />
        <Field label="Carton Count" value={values.carton_count} onChange={(v) => setValues((s) => ({ ...s, carton_count: v }))} type="number" />
        <Field label="Carton Dimensions" value={values.carton_dimensions} onChange={(v) => setValues((s) => ({ ...s, carton_dimensions: v }))} placeholder='e.g. 40x30x30 cm' />
        <Field label="Gross Weight (kg)" value={values.gross_weight_kg} onChange={(v) => setValues((s) => ({ ...s, gross_weight_kg: v }))} type="number" />
        <Field label="CBM" value={values.cbm} onChange={(v) => setValues((s) => ({ ...s, cbm: v }))} type="number" />
        <Field label="Date Shipped from China" value={values.date_shipped_from_china} onChange={(v) => setValues((s) => ({ ...s, date_shipped_from_china: v }))} type="date" />
        <Field label="Estimated Arrival" value={values.estimated_arrival} onChange={(v) => setValues((s) => ({ ...s, estimated_arrival: v }))} type="date" />
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea
          className="input"
          rows={3}
          value={values.notes}
          onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-gold">
          {loading ? "Saving..." : shipment ? "Save Changes" : "Create Shipment"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        step={type === "number" ? "0.01" : undefined}
        className="input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
