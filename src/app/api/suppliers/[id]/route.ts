import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const [{ data: supplier, error }, { data: stats }] = await Promise.all([
    supabase.from("suppliers").select("*").eq("id", params.id).single(),
    supabase.from("supplier_stats").select("*").eq("supplier_id", params.id).maybeSingle(),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ data: supplier, stats });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const body = await request.json();

  const allowed = [
    "name",
    "company_name",
    "contact_person",
    "phone",
    "wechat",
    "whatsapp",
    "link_1688",
    "alibaba_url",
    "address",
    "notes",
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const { data, error } = await supabase
    .from("suppliers")
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
  const { error } = await supabase.from("suppliers").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
