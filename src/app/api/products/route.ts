import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const q = request.nextUrl.searchParams.get("q");

  let query = supabase
    .from("products")
    .select("*, default_supplier:suppliers(id,name)")
    .order("name");

  if (q) {
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,category.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();

  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "Product name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      name: body.name,
      sku: body.sku || null,
      description: body.description ?? null,
      category: body.category ?? null,
      unit: body.unit || "pcs",
      default_supplier_id: body.default_supplier_id || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}
