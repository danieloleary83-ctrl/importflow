import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("problems_claims")
    .select(
      "*, supplier:suppliers(id,name), purchase_order:purchase_orders(id,order_number), shipment:shipments(id,reference), product:products(id,name)"
    )
    .eq("id", params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const body = await request.json();

  const allowed = ["status", "resolution", "refund_amount", "refund_currency", "replacement_order_id", "date_resolved", "description"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key] === "" ? null : body[key];
  }
  if (update.status && ["resolved", "refunded", "replaced", "closed_no_action"].includes(update.status as string) && !update.date_resolved) {
    update.date_resolved = new Date().toISOString().slice(0, 10);
  }

  const { data, error } = await supabase
    .from("problems_claims")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { error } = await supabase.from("problems_claims").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
