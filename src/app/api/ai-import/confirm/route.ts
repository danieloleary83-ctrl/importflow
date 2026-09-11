import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface ConfirmItem {
  product_id?: string | null;
  product_name: string;
  sku?: string | null;
  quantity: number;
  unit_price_rmb?: number | null;
  unit_price_eur?: number | null;
}

/**
 * Writes AI-extracted (and user-corrected) data into the database:
 * - Reuses an existing supplier if supplier.id is given, otherwise creates one.
 * - Reuses an existing purchase order if order.id is given (updates it), otherwise creates one.
 * - For each item: reuses an existing product if product_id is given, otherwise creates one,
 *   then adds/updates the order line item.
 * - Optionally creates/updates a shipment and consolidates this order into it.
 * - Optionally records costs against the order and/or shipment.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();

  // ---- 1. Supplier -------------------------------------------------------
  let supplierId: string | null = body.supplier?.id || null;

  if (!supplierId) {
    if (!body.supplier?.name) {
      return NextResponse.json({ error: "A supplier is required" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("suppliers")
      .insert({
        name: body.supplier.name,
        company_name: body.supplier.company_name || null,
        contact_person: body.supplier.contact_person || null,
        phone: body.supplier.phone || null,
        wechat: body.supplier.wechat || null,
        whatsapp: body.supplier.whatsapp || null,
        link_1688: body.supplier.link_1688 || null,
        alibaba_url: body.supplier.alibaba_url || null,
        address: body.supplier.address || null,
      })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: `Supplier: ${error.message}` }, { status: 400 });
    supplierId = data.id;
  }

  // ---- 2. Purchase order --------------------------------------------------
  let orderId: string = body.order?.id || "";
  const orderFields = {
    supplier_id: supplierId,
    order_number: body.order?.order_number || null,
    date_ordered: body.order?.date_ordered || null,
    currency: body.order?.currency || "RMB",
    exchange_rate: body.order?.exchange_rate ?? null,
    notes: body.order?.notes || null,
  };

  if (orderId) {
    const { error } = await supabase.from("purchase_orders").update(orderFields).eq("id", orderId);
    if (error) return NextResponse.json({ error: `Order: ${error.message}` }, { status: 400 });
  } else {
    const { data, error } = await supabase
      .from("purchase_orders")
      .insert({ ...orderFields, status: "ordered" })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: `Order: ${error.message}` }, { status: 400 });
    orderId = data.id;
  }

  // ---- 3. Items: resolve products, then insert order line items ----------
  const items: ConfirmItem[] = body.items ?? [];
  for (const item of items) {
    let productId = item.product_id || null;

    if (!productId && item.product_name) {
      const { data: newProduct, error } = await supabase
        .from("products")
        .insert({
          name: item.product_name,
          sku: item.sku || null,
          default_supplier_id: supplierId,
        })
        .select("id")
        .single();
      if (error) return NextResponse.json({ error: `Product: ${error.message}` }, { status: 400 });
      productId = newProduct.id;
    }

    const quantity = Number(item.quantity) || 0;
    const unitRmb = item.unit_price_rmb ?? null;
    const unitEur = item.unit_price_eur ?? null;

    const { error: itemError } = await supabase.from("purchase_order_items").insert({
      purchase_order_id: orderId,
      product_id: productId,
      description: item.product_name,
      quantity,
      unit_price_rmb: unitRmb,
      unit_price_eur: unitEur,
      line_total_rmb: unitRmb !== null ? Math.round(unitRmb * quantity * 100) / 100 : null,
      line_total_eur: unitEur !== null ? Math.round(unitEur * quantity * 100) / 100 : null,
    });
    if (itemError) return NextResponse.json({ error: `Item: ${itemError.message}` }, { status: 400 });
  }

  // ---- 4. Shipping / shipment ---------------------------------------------
  let shipmentId: string | null = null;
  if (body.shipping && (body.shipping.id || body.shipping.tracking_number || body.shipping.carton_count)) {
    const shipping = body.shipping;
    const shipmentFields: Record<string, unknown> = {};
    for (const key of [
      "reference",
      "tracking_number",
      "shipping_agent",
      "shipping_method",
      "carton_count",
      "carton_dimensions",
      "date_shipped_from_china",
      "estimated_arrival",
    ]) {
      if (shipping[key] !== undefined && shipping[key] !== "") shipmentFields[key] = shipping[key];
    }
    if (shipping.weight_kg !== undefined) shipmentFields.gross_weight_kg = shipping.weight_kg;
    if (shipping.cbm !== undefined) shipmentFields.cbm = shipping.cbm;

    if (shipping.id) {
      shipmentId = shipping.id;
      const { error } = await supabase.from("shipments").update(shipmentFields).eq("id", shipmentId);
      if (error) return NextResponse.json({ error: `Shipment: ${error.message}` }, { status: 400 });
    } else {
      const { data, error } = await supabase
        .from("shipments")
        .insert({ ...shipmentFields, status: "at_china_warehouse" })
        .select("id")
        .single();
      if (error) return NextResponse.json({ error: `Shipment: ${error.message}` }, { status: 400 });
      shipmentId = data.id;
    }

    // Log this as a tracking update if we got a status/location note from AI
    if (shipping.tracking_note) {
      await supabase.from("tracking_updates").insert({
        shipment_id: shipmentId,
        note: shipping.tracking_note,
        source: "ai_import",
      });
    }

    // Consolidate this order's items into the shipment
    const { data: poItems } = await supabase
      .from("purchase_order_items")
      .select("id")
      .eq("purchase_order_id", orderId);
    const rows =
      poItems && poItems.length > 0
        ? poItems.map((it) => ({
            shipment_id: shipmentId,
            purchase_order_id: orderId,
            purchase_order_item_id: it.id,
          }))
        : [{ shipment_id: shipmentId, purchase_order_id: orderId, purchase_order_item_id: null }];
    await supabase
      .from("shipment_items")
      .upsert(rows, { onConflict: "shipment_id,purchase_order_item_id", ignoreDuplicates: true });
  }

  // ---- 5. Costs -------------------------------------------------------------
  const costs = body.costs ?? [];
  for (const cost of costs) {
    if (!cost.amount) continue;
    const currency = cost.currency || "EUR";
    const amountEur = currency === "EUR" ? cost.amount : cost.amount_eur ?? cost.amount;
    await supabase.from("costs").insert({
      purchase_order_id: cost.attach_to === "shipment" ? null : orderId,
      shipment_id: cost.attach_to === "shipment" ? shipmentId : null,
      cost_type: cost.cost_type,
      amount: cost.amount,
      currency,
      amount_eur: amountEur,
    });
  }

  return NextResponse.json({ order_id: orderId, supplier_id: supplierId, shipment_id: shipmentId });
}
