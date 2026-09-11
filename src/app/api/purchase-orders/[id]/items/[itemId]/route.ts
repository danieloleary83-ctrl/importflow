import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildItemRow } from "@/lib/purchase-order-items";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  const supabase = createClient();
  const body = await request.json();
  const row = buildItemRow(params.id, body);
  delete (row as any).purchase_order_id;

  const { data, error } = await supabase
    .from("purchase_order_items")
    .update(row)
    .eq("id", params.itemId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  const supabase = createClient();
  const { error } = await supabase.from("purchase_order_items").delete().eq("id", params.itemId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
