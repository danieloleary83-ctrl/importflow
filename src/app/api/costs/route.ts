import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_COST_TYPES = [
  "china_domestic_shipping",
  "international_freight",
  "customs_duty",
  "import_vat",
  "other",
];

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();

  if (!body.purchase_order_id && !body.shipment_id) {
    return NextResponse.json(
      { error: "A cost must be linked to a purchase_order_id or shipment_id" },
      { status: 400 }
    );
  }
  if (!VALID_COST_TYPES.includes(body.cost_type)) {
    return NextResponse.json({ error: "Invalid cost_type" }, { status: 400 });
  }
  if (body.amount === undefined || body.amount === null) {
    return NextResponse.json({ error: "amount is required" }, { status: 400 });
  }

  const currency = body.currency || "EUR";
  const amount = Number(body.amount);
  const amountEur = body.amount_eur !== undefined && body.amount_eur !== null
    ? Number(body.amount_eur)
    : currency === "EUR"
    ? amount
    : null;

  if (amountEur === null) {
    return NextResponse.json(
      { error: "amount_eur is required when currency is not EUR" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("costs")
    .insert({
      purchase_order_id: body.purchase_order_id || null,
      shipment_id: body.shipment_id || null,
      cost_type: body.cost_type,
      description: body.description ?? null,
      amount,
      currency,
      amount_eur: amountEur,
      date_incurred: body.date_incurred || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}
