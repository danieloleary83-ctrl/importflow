import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const [{ data: product, error }, { data: history }] = await Promise.all([
    supabase
      .from("products")
      .select("*, default_supplier:suppliers(id,name)")
      .eq("id", params.id)
      .single(),
    supabase
      .from("product_cost_history")
      .select("*")
      .eq("product_id", params.id)
      .order("date_ordered", { ascending: false }),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ data: product, history: history ?? [] });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const body = await request.json();

  const allowed = ["name", "sku", "description", "category", "unit", "default_supplier_id"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key] || null;
  }

  const { data, error } = await supabase
    .from("products")
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
  const { error } = await supabase.from("products").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
