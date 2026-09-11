import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AttachmentEntityType } from "@/lib/types/database";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const entityType = request.nextUrl.searchParams.get("entity_type");
  const entityId = request.nextUrl.searchParams.get("entity_id");

  if (!entityType || !entityId) {
    return NextResponse.json({ error: "entity_type and entity_id are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("attachments")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("uploaded_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Attach short-lived signed URLs so the browser can display private files
  const withUrls = await Promise.all(
    (data ?? []).map(async (a) => {
      const { data: signed } = await supabase.storage
        .from("attachments")
        .createSignedUrl(a.file_path, 60 * 60);
      return { ...a, url: signed?.signedUrl ?? null };
    })
  );

  return NextResponse.json({ data: withUrls });
}

const VALID_ENTITY_TYPES: AttachmentEntityType[] = [
  "supplier",
  "product",
  "purchase_order",
  "shipment",
  "problem",
];

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();

  if (!VALID_ENTITY_TYPES.includes(body.entity_type)) {
    return NextResponse.json({ error: "Invalid entity_type" }, { status: 400 });
  }
  if (!body.entity_id || !body.file_path) {
    return NextResponse.json({ error: "entity_id and file_path are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("attachments")
    .insert({
      entity_type: body.entity_type,
      entity_id: body.entity_id,
      file_path: body.file_path,
      file_name: body.file_name ?? null,
      file_type: body.file_type ?? null,
      notes: body.notes ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}
