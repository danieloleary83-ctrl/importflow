import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from("tracking_updates")
    .insert({
      shipment_id: params.id,
      status: body.status || null,
      location: body.location || null,
      note: body.note || null,
      event_date: body.event_date || new Date().toISOString(),
      source: body.source || "manual",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}
