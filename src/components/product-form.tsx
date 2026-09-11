"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Product, Supplier } from "@/lib/types/database";

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [values, setValues] = useState({
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    description: product?.description ?? "",
    category: product?.category ?? "",
    unit: product?.unit ?? "pcs",
    default_supplier_id: product?.default_supplier_id ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("suppliers")
      .select("*")
      .order("name")
      .then(({ data }) => setSuppliers(data ?? []));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!values.name.trim()) {
      setError("Product name is required");
      return;
    }
    setLoading(true);
    setError(null);

    const url = product ? `/api/products/${product.id}` : "/api/products";
    const method = product ? "PATCH" : "POST";
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

    router.push(`/products/${json.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 max-w-2xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Product Name *</label>
          <input
            className="input"
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">SKU</label>
          <input
            className="input"
            value={values.sku}
            onChange={(e) => setValues((v) => ({ ...v, sku: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Category</label>
          <input
            className="input"
            value={values.category}
            onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Unit</label>
          <input
            className="input"
            value={values.unit}
            onChange={(e) => setValues((v) => ({ ...v, unit: e.target.value }))}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Default Supplier</label>
          <select
            className="input"
            value={values.default_supplier_id}
            onChange={(e) => setValues((v) => ({ ...v, default_supplier_id: e.target.value }))}
          >
            <option value="">None</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          className="input"
          rows={3}
          value={values.description}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-gold">
          {loading ? "Saving..." : product ? "Save Changes" : "Add Product"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
