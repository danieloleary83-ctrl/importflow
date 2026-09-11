import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { EXTRACT_TOOL, type ExtractedData } from "@/lib/ai/extract-schema";

export const maxDuration = 60;

interface ImagePayload {
  data: string; // base64, no data: prefix
  media_type: string;
}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set. Add it in your environment variables." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const images: ImagePayload[] = body.images ?? [];
  const notes: string = body.notes ?? "";

  if (images.length === 0) {
    return NextResponse.json({ error: "Upload at least one screenshot or photo" }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const content: Anthropic.MessageParam["content"] = [
    {
      type: "text",
      text:
        "These are screenshots, photos or supplier messages related to a China purchase order for " +
        "an auto parts business called Inch Autos. Read everything carefully - including Chinese text " +
        "(1688, Alibaba, WeChat) - and call extract_purchase_data with everything you can find. " +
        "Leave fields out if you're not confident, rather than guessing. Quantities and prices are " +
        "usually in Chinese Yuan (RMB) unless clearly stated otherwise." +
        (notes ? `\n\nUser notes: ${notes}` : ""),
    },
    ...images.map((img) => ({
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: img.media_type as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
        data: img.data,
      },
    })),
  ];

  let extracted: ExtractedData = {};

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 4096,
      tools: [EXTRACT_TOOL],
      tool_choice: { type: "tool", name: "extract_purchase_data" },
      messages: [{ role: "user", content }],
    });

    const toolUse = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );
    if (toolUse) {
      extracted = toolUse.input as ExtractedData;
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: `AI extraction failed: ${err.message || "Unknown error"}` },
      { status: 502 }
    );
  }

  const supabase = createClient();
  const matches: Record<string, unknown> = {};

  // Try to find an existing supplier by name
  if (extracted.supplier?.name) {
    const { data } = await supabase
      .from("suppliers")
      .select("id, name")
      .ilike("name", `%${extracted.supplier.name}%`)
      .limit(1)
      .maybeSingle();
    if (data) matches.supplier = data;
  }

  // Try to find an existing purchase order by order number
  if (extracted.order?.order_number) {
    const { data } = await supabase
      .from("purchase_orders")
      .select("id, order_number, supplier_id")
      .eq("order_number", extracted.order.order_number)
      .limit(1)
      .maybeSingle();
    if (data) matches.purchase_order = data;
  }

  // Try to find an existing shipment by tracking number
  if (extracted.shipping?.tracking_number) {
    const { data } = await supabase
      .from("shipments")
      .select("id, reference, tracking_number")
      .eq("tracking_number", extracted.shipping.tracking_number)
      .limit(1)
      .maybeSingle();
    if (data) matches.shipment = data;
  }

  // Try to find an existing product per item
  let productMatches: (Record<string, unknown> | null)[] = [];
  if (extracted.items && extracted.items.length > 0) {
    productMatches = await Promise.all(
      extracted.items.map(async (item) => {
        if (item.sku) {
          const { data } = await supabase
            .from("products")
            .select("id, name, sku")
            .eq("sku", item.sku)
            .maybeSingle();
          if (data) return data;
        }
        const { data } = await supabase
          .from("products")
          .select("id, name, sku")
          .ilike("name", `%${item.product_name}%`)
          .limit(1)
          .maybeSingle();
        return data ?? null;
      })
    );
  }

  return NextResponse.json({
    extracted,
    matches: {
      ...matches,
      products: productMatches,
    },
  });
}
