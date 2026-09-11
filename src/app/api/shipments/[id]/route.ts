import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const [{ data: shipment, error }, { data: items }, { data: costs }, { data: trackingUpdates }] =
    await Promise.all([
      supabase.from("shipments").select("*").eq("id", params.id).single(),
      supabase
        .from("shipment_items")
        .select("*, purchase_order:purchase_orders(id,order_number,supplier:suppliers(id,name))")
        .eq("shipment_id", params.id),
      supabase.from("costs").select("*").eq("shipment_id", params.id).order("created_at"),
      supabase
        .from("tracking_updates")
        .select("*")
        .eq("shipment_id", params.id)
        .order("event_date", { ascending: false }),
    ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  return NextResponse.json({
    data: shipment,
    items: items ?? [],
    costs: costs ?? [],
    trackingUpdates: trackingUpdates ?? [],
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const body = await request.json();

  const allowed = [
    "reference",
    "shipping_agent",
    "shipping_method",
    "tracking_number",
    "status",
    "warehouse",
    "shipping_mark",
    "carton_count",
    "carton_dimensions",
    "gross_weight_kg",
    "cbm",
    "cost_allocation_method",
    "date_shipped_from_china",
    "estimated_arrival",
    "actual_arrival",
    "date_delivered",
    "notes",
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key] === "" ? null : body[key];
  }

  const { data, error } = await supabase
    .from("shipments")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Keep linked purchase orders' status in sync when the shipment status changes
  if (update.status) {
    const { data: links } = await supabase
      .from("shipment_items")
      .select("purchase_order_id")
      .eq("shipment_id", params.id);
    const poIds = Array.from(new Set((links ?? []).map((l) => l.purchase_order_id)));
    if (poIds.length > 0) {
      await supabase.from("purchase_orders").update({ status: update.status }).in("id", poIds);
    }
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { error } = await supabase.from("shipments").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
