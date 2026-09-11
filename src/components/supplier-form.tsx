"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Supplier } from "@/lib/types/database";

const FIELDS: { key: keyof Supplier; label: string; placeholder?: string }[] = [
  { key: "name", label: "Supplier Name *", placeholder: "e.g. Shenzhen ABC Auto Parts" },
  { key: "company_name", label: "Company Name" },
  { key: "contact_person", label: "Contact Person" },
  { key: "phone", label: "Phone" },
  { key: "wechat", label: "WeChat ID" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "link_1688", label: "1688 Link", placeholder: "https://..." },
  { key: "alibaba_url", label: "Alibaba Link", placeholder: "https://..." },
];

export function SupplierForm({ supplier }: { supplier?: Supplier }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const f of FIELDS) initial[f.key] = (supplier?.[f.key] as string) ?? "";
    initial.address = supplier?.address ?? "";
    initial.notes = supplier?.notes ?? "";
    return initial;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!values.name.trim()) {
      setError("Supplier name is required");
      return;
    }
    setLoading(true);
    setError(null);

    const url = supplier ? `/api/suppliers/${supplier.id}` : "/api/suppliers";
    const method = supplier ? "PATCH" : "POST";

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

    router.push(`/suppliers/${json.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 max-w-2xl">
      <div className="grid sm:grid-cols-2 gap-4">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="label">{f.label}</label>
            <input
              className="input"
              placeholder={f.placeholder}
              value={values[f.key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>

      <div>
        <label className="label">Address</label>
        <textarea
          className="input"
          rows={2}
          value={values.address}
          onChange={(e) => setValues((v) => ({ ...v, address: e.target.value }))}
        />
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
          {loading ? "Saving..." : supplier ? "Save Changes" : "Add Supplier"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
