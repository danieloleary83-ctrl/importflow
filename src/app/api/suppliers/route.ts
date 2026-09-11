import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const q = request.nextUrl.searchParams.get("q");

  let query = supabase.from("suppliers").select("*").order("name");

  if (q) {
    query = query.or(
      `name.ilike.%${q}%,company_name.ilike.%${q}%,contact_person.ilike.%${q}%`
    );
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();

  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "Supplier name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      name: body.name,
      company_name: body.company_name ?? null,
      contact_person: body.contact_person ?? null,
      phone: body.phone ?? null,
      wechat: body.wechat ?? null,
      whatsapp: body.whatsapp ?? null,
      link_1688: body.link_1688 ?? null,
      alibaba_url: body.alibaba_url ?? null,
      address: body.address ?? null,
      notes: body.notes ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}
