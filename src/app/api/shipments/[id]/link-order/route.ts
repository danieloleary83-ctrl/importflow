import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Consolidates a purchase order into this shipment. Body: { purchase_order_id }.
 * Links every item on that order into the shipment in one go.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const body = await request.json();

  if (!body.purchase_order_id) {
    return NextResponse.json({ error: "purchase_order_id is required" }, { status: 400 });
  }

  const { data: poItems, error: itemsError } = await supabase
    .from("purchase_order_items")
    .select("id")
    .eq("purchase_order_id", body.purchase_order_id);

  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 400 });

  const rows =
    poItems && poItems.length > 0
      ? poItems.map((it) => ({
          shipment_id: params.id,
          purchase_order_id: body.purchase_order_id,
          purchase_order_item_id: it.id,
        }))
      : [{ shipment_id: params.id, purchase_order_id: body.purchase_order_id, purchase_order_item_id: null }];

  const { error } = await supabase.from("shipment_items").upsert(rows, {
    onConflict: "shipment_id,purchase_order_item_id",
    ignoreDuplicates: true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

/** Removes a purchase order (and all its items) from this shipment. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const purchaseOrderId = request.nextUrl.searchParams.get("purchase_order_id");

  if (!purchaseOrderId) {
    return NextResponse.json({ error: "purchase_order_id is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("shipment_items")
    .delete()
    .eq("shipment_id", params.id)
    .eq("purchase_order_id", purchaseOrderId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
