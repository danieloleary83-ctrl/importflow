import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const status = request.nextUrl.searchParams.get("status");

  let query = supabase
    .from("problems_claims")
    .select("*, supplier:suppliers(id,name), purchase_order:purchase_orders(id,order_number)")
    .order("date_reported", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();

  if (!body.type || !body.description) {
    return NextResponse.json({ error: "Type and description are required" }, { status: 400 });
  }

  // Auto-fill supplier/product from the linked order if not given directly
  let supplierId = body.supplier_id || null;
  let productId = body.product_id || null;

  if (body.purchase_order_id && !supplierId) {
    const { data: po } = await supabase
      .from("purchase_orders")
      .select("supplier_id")
      .eq("id", body.purchase_order_id)
      .maybeSingle();
    if (po) supplierId = po.supplier_id;
  }

  const { data, error } = await supabase
    .from("problems_claims")
    .insert({
      purchase_order_id: body.purchase_order_id || null,
      shipment_id: body.shipment_id || null,
      supplier_id: supplierId,
      product_id: productId,
      type: body.type,
      description: body.description,
      status: body.status || "open",
      date_reported: body.date_reported || new Date().toISOString().slice(0, 10),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Reflect the problem on the linked order/shipment status
  if (body.purchase_order_id) {
    await supabase.from("purchase_orders").update({ status: "problem" }).eq("id", body.purchase_order_id);
  }

  return NextResponse.json({ data }, { status: 201 });
}
