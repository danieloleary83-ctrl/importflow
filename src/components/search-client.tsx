"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";

export function SearchClient() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any>({ suppliers: [], products: [], orders: [], shipments: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) {
      setResults({ suppliers: [], products: [], orders: [], shipments: [] });
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      setResults(json);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [q]);

  const hasResults =
    results.suppliers.length + results.products.length + results.orders.length + results.shipments.length > 0;

  return (
    <div className="max-w-2xl">
      <div className="relative mb-6">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
        <input
          className="input pl-10"
          placeholder="Search supplier, product, SKU, order number, tracking number..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
      </div>

      {loading && <p className="text-sm text-neutral-400">Searching...</p>}

      {!loading && q && !hasResults && <p className="text-sm text-neutral-400">No results for &quot;{q}&quot;.</p>}

      <div className="space-y-6">
        {results.suppliers.length > 0 && (
          <ResultGroup title="Suppliers">
            {results.suppliers.map((s: any) => (
              <Link key={s.id} href={`/suppliers/${s.id}`} className="block py-2 hover:text-gold-dark">
                {s.name} {s.company_name && <span className="text-neutral-400">· {s.company_name}</span>}
              </Link>
            ))}
          </ResultGroup>
        )}
        {results.products.length > 0 && (
          <ResultGroup title="Products">
            {results.products.map((p: any) => (
              <Link key={p.id} href={`/products/${p.id}`} className="block py-2 hover:text-gold-dark">
                {p.name} {p.sku && <span className="text-neutral-400">· {p.sku}</span>}
              </Link>
            ))}
          </ResultGroup>
        )}
        {results.orders.length > 0 && (
          <ResultGroup title="Purchase Orders">
            {results.orders.map((o: any) => (
              <Link key={o.id} href={`/orders/${o.id}`} className="block py-2 hover:text-gold-dark">
                {o.order_number || "No order #"} <span className="text-neutral-400">· {o.supplier?.name}</span>
              </Link>
            ))}
          </ResultGroup>
        )}
        {results.shipments.length > 0 && (
          <ResultGroup title="Shipments">
            {results.shipments.map((s: any) => (
              <Link key={s.id} href={`/shipments/${s.id}`} className="block py-2 hover:text-gold-dark">
                {s.reference || "Unnamed"} <span className="text-neutral-400">· {s.tracking_number}</span>
              </Link>
            ))}
          </ResultGroup>
        )}
      </div>
    </div>
  );
}

function ResultGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">{title}</h3>
      <div className="divide-y divide-line text-sm">{children}</div>
    </div>
  );
}
