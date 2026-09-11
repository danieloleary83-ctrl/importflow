import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProblemDetailClient } from "@/components/problem-detail-client";

export const dynamic = "force-dynamic";

export default async function ProblemDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: problem } = await supabase
    .from("problems_claims")
    .select(
      "*, supplier:suppliers(id,name), purchase_order:purchase_orders(id,order_number), shipment:shipments(id,reference)"
    )
    .eq("id", params.id)
    .single();

  if (!problem) notFound();

  return <ProblemDetailClient problemId={params.id} initialProblem={problem} />;
}
