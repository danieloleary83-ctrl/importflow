import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const status = request.nextUrl.searchParams.get("status");

  let query = supabase
    .from("shipments")
    .select("*, shipment_items(id)")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from("shipments")
    .insert({
      reference: body.reference || null,
      shipping_agent: body.shipping_agent || null,
      shipping_method: body.shipping_method || null,
      tracking_number: body.tracking_number || null,
      status: body.status || "at_china_warehouse",
      warehouse: body.warehouse || "Shenzhen Xietong Warehouse",
      shipping_mark: body.shipping_mark || "INCH AUTOS",
      carton_count: body.carton_count ?? null,
      carton_dimensions: body.carton_dimensions || null,
      gross_weight_kg: body.gross_weight_kg ?? null,
      cbm: body.cbm ?? null,
      cost_allocation_method: body.cost_allocation_method || "value",
      date_shipped_from_china: body.date_shipped_from_china || null,
      estimated_arrival: body.estimated_arrival || null,
      actual_arrival: body.actual_arrival || null,
      notes: body.notes ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}
