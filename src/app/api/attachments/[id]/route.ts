import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const { data: attachment } = await supabase
    .from("attachments")
    .select("file_path")
    .eq("id", params.id)
    .single();

  if (attachment) {
    await supabase.storage.from("attachments").remove([attachment.file_path]);
  }

  const { error } = await supabase.from("attachments").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
