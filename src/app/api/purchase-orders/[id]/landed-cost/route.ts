import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateLandedCost } from "@/lib/utils/landed-cost";
import type { CostAllocationMethod } from "@/lib/types/database";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const method = (request.nextUrl.searchParams.get("method") || "value") as CostAllocationMethod;

  const [{ data: items, error }, { data: summary }] = await Promise.all([
    supabase
      .from("purchase_order_items")
      .select("id, product_id, quantity, line_total_eur")
      .eq("purchase_order_id", params.id),
    supabase
      .from("purchase_order_cost_summary")
      .select("*")
      .eq("purchase_order_id", params.id)
      .maybeSingle(),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const totalAllocatableCostsEur =
    (summary?.direct_costs_eur ?? 0) + (summary?.allocated_shipping_eur ?? 0);

  const results = calculateLandedCost({
    lines: (items ?? []).map((i) => ({
      purchase_order_item_id: i.id,
      product_id: i.product_id,
      quantity: Number(i.quantity) || 0,
      line_total_eur: Number(i.line_total_eur) || 0,
    })),
    totalAllocatableCostsEur,
    method,
  });

  return NextResponse.json({
    data: results,
    totals: {
      items_total_eur: summary?.items_total_eur ?? 0,
      direct_costs_eur: summary?.direct_costs_eur ?? 0,
      allocated_shipping_eur: summary?.allocated_shipping_eur ?? 0,
      landed_total_eur: results.reduce((sum, r) => sum + r.landed_cost_eur, 0),
    },
    method,
  });
}
