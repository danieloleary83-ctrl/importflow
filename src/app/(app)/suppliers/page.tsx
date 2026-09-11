import Link from "next/link";
import { Plus, Phone, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui";
import { formatEUR } from "@/lib/utils/format";
import type { SupplierStats } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const supabase = createClient();
  let query = supabase.from("suppliers").select("*").order("name");
  if (searchParams.q) {
    query = query.or(
      `name.ilike.%${searchParams.q}%,company_name.ilike.%${searchParams.q}%`
    );
  }
  const { data: suppliers } = await query;
  const { data: stats } = await supabase.from("supplier_stats").select("*");
  const statsById = new Map((stats as SupplierStats[] | null)?.map((s) => [s.supplier_id, s]));

  return (
    <div>
      <PageHeader
        title="Suppliers"
        subtitle="Every supplier you buy from in China, reused across orders."
        action={
          <div className="flex gap-3">
            <a href="/api/export/csv?type=suppliers" className="btn-secondary">
              Export CSV
            </a>
            <Link href="/suppliers/new" className="btn-gold">
              <Plus size={16} /> Add Supplier
            </Link>
          </div>
        }
      />

      <form className="mb-5">
        <input
          type="text"
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search suppliers by name or company..."
          className="input max-w-md"
        />
      </form>

      {!suppliers || suppliers.length === 0 ? (
        <EmptyState
          title="No suppliers yet"
          description="Add your first supplier, or use AI Import to create one automatically from a screenshot."
          actionHref="/suppliers/new"
          actionLabel="Add Supplier"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s) => {
            const st = statsById.get(s.id);
            return (
              <Link key={s.id} href={`/suppliers/${s.id}`} className="card block hover:border-gold transition-colors">
                <div className="font-semibold text-ink">{s.name}</div>
                {s.company_name && (
                  <div className="text-sm text-neutral-500">{s.company_name}</div>
                )}
                <div className="flex items-center gap-3 mt-3 text-xs text-neutral-500">
                  {s.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} /> {s.phone}
                    </span>
                  )}
                  {s.wechat && (
                    <span className="flex items-center gap-1">
                      <MessageCircle size={12} /> {s.wechat}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-line text-sm">
                  <span className="text-neutral-500">
                    {st?.total_orders ?? 0} order{(st?.total_orders ?? 0) === 1 ? "" : "s"}
                  </span>
                  <span className="font-semibold text-ink">
                    {formatEUR(st?.total_spend_eur ?? 0)}
                  </span>
                </div>
                {st && st.open_problems > 0 && (
                  <div className="mt-2 text-xs font-semibold text-red-600">
                    {st.open_problems} open problem{st.open_problems === 1 ? "" : "s"}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
