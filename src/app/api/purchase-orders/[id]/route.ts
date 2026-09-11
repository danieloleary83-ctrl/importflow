import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const [{ data: order, error }, { data: items }, { data: costs }, { data: summary }, { data: shipmentLinks }] =
    await Promise.all([
      supabase
        .from("purchase_orders")
        .select("*, supplier:suppliers(id,name,phone,wechat)")
        .eq("id", params.id)
        .single(),
      supabase
        .from("purchase_order_items")
        .select("*, product:products(id,name,sku)")
        .eq("purchase_order_id", params.id)
        .order("created_at"),
      supabase.from("costs").select("*").eq("purchase_order_id", params.id).order("created_at"),
      supabase
        .from("purchase_order_cost_summary")
        .select("*")
        .eq("purchase_order_id", params.id)
        .maybeSingle(),
      supabase
        .from("shipment_items")
        .select("*, shipment:shipments(id,reference,status,tracking_number)")
        .eq("purchase_order_id", params.id),
    ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  return NextResponse.json({
    data: order,
    items: items ?? [],
    costs: costs ?? [],
    summary,
    shipmentLinks: shipmentLinks ?? [],
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const body = await request.json();

  const allowed = [
    "order_number",
    "supplier_id",
    "status",
    "currency",
    "exchange_rate",
    "date_ordered",
    "date_dispatched",
    "date_received_at_warehouse",
    "notes",
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key] === "" ? null : body[key];
  }

  const { data, error } = await supabase
    .from("purchase_orders")
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
  const { error } = await supabase.from("purchase_orders").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
