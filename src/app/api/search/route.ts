import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const q = request.nextUrl.searchParams.get("q")?.trim();

  if (!q) return NextResponse.json({ suppliers: [], products: [], orders: [], shipments: [] });

  const like = `%${q}%`;

  const [{ data: suppliers }, { data: products }, { data: orders }, { data: shipments }] = await Promise.all([
    supabase.from("suppliers").select("id, name, company_name").or(`name.ilike.${like},company_name.ilike.${like}`).limit(10),
    supabase.from("products").select("id, name, sku").or(`name.ilike.${like},sku.ilike.${like}`).limit(10),
    supabase
      .from("purchase_orders")
      .select("id, order_number, notes, supplier:suppliers(name)")
      .or(`order_number.ilike.${like},notes.ilike.${like}`)
      .limit(10),
    supabase
      .from("shipments")
      .select("id, reference, tracking_number")
      .or(`reference.ilike.${like},tracking_number.ilike.${like}`)
      .limit(10),
  ]);

  return NextResponse.json({
    suppliers: suppliers ?? [],
    products: products ?? [],
    orders: orders ?? [],
    shipments: shipments ?? [],
  });
}
