import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/utils/format";
import { PROBLEM_STATUS_LABELS, PROBLEM_TYPE_LABELS, problemStatusColor } from "@/lib/utils/status";

export const dynamic = "force-dynamic";

export default async function ProblemsPage() {
  const supabase = createClient();
  const { data: problems } = await supabase
    .from("problems_claims")
    .select("*, supplier:suppliers(id,name), purchase_order:purchase_orders(id,order_number)")
    .order("date_reported", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Problems & Claims"
        subtitle="Missing goods, damage, disputes and their resolutions."
        action={
          <Link href="/problems/new" className="btn-gold">
            <Plus size={16} /> Report a Problem
          </Link>
        }
      />

      {!problems || problems.length === 0 ? (
        <EmptyState title="No problems recorded" description="Hopefully it stays that way." />
      ) : (
        <div className="space-y-3">
          {problems.map((p: any) => (
            <Link key={p.id} href={`/problems/${p.id}`} className="card flex items-center justify-between hover:border-gold transition-colors">
              <div>
                <div className="font-semibold">{PROBLEM_TYPE_LABELS[p.type] || p.type}</div>
                <div className="text-sm text-neutral-500 mt-0.5 line-clamp-1">{p.description}</div>
                <div className="text-xs text-neutral-400 mt-1">
                  {p.supplier?.name || "No supplier"} · {p.purchase_order?.order_number || "No order"} · {formatDate(p.date_reported)}
                </div>
              </div>
              <StatusBadge label={PROBLEM_STATUS_LABELS[p.status as keyof typeof PROBLEM_STATUS_LABELS]} className={problemStatusColor(p.status)} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
