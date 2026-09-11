import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildItemRow } from "@/lib/purchase-order-items";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const status = request.nextUrl.searchParams.get("status");
  const supplierId = request.nextUrl.searchParams.get("supplier_id");

  let query = supabase
    .from("purchase_orders")
    .select("*, supplier:suppliers(id,name), items:purchase_order_items(id)")
    .order("date_ordered", { ascending: false, nullsFirst: false });

  if (status) query = query.eq("status", status);
  if (supplierId) query = query.eq("supplier_id", supplierId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

/**
 * Creates a purchase order together with its line items in one call.
 * Body: { order_number, supplier_id, status, currency, exchange_rate,
 *         date_ordered, notes, items: [{ product_id?, description, quantity,
 *         unit_price_rmb, unit_price_eur }] }
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();

  if (!body.supplier_id) {
    return NextResponse.json({ error: "supplier_id is required" }, { status: 400 });
  }

  const { data: order, error } = await supabase
    .from("purchase_orders")
    .insert({
      order_number: body.order_number || null,
      supplier_id: body.supplier_id,
      status: body.status || "ordered",
      currency: body.currency || "RMB",
      exchange_rate: body.exchange_rate ?? null,
      date_ordered: body.date_ordered || null,
      date_dispatched: body.date_dispatched || null,
      date_received_at_warehouse: body.date_received_at_warehouse || null,
      notes: body.notes ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length > 0) {
    const rows = items.map((it: any) => buildItemRow(order.id, it));
    const { error: itemsError } = await supabase.from("purchase_order_items").insert(rows);
    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 400 });
  }

  return NextResponse.json({ data: order }, { status: 201 });
}
