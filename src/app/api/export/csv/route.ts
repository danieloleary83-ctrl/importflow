import { NextResponse, type NextRequest } from "next/server";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const type = request.nextUrl.searchParams.get("type") || "orders";

  let rows: Record<string, unknown>[] = [];
  let filename = "export.csv";

  if (type === "suppliers") {
    filename = "suppliers.csv";
    const { data } = await supabase.from("suppliers").select("*").order("name");
    rows = (data ?? []).map((s) => ({
      Name: s.name,
      "Company Name": s.company_name,
      "Contact Person": s.contact_person,
      Phone: s.phone,
      WeChat: s.wechat,
      WhatsApp: s.whatsapp,
      "1688 Link": s.link_1688,
      "Alibaba Link": s.alibaba_url,
      Address: s.address,
      Notes: s.notes,
    }));
  } else if (type === "products") {
    filename = "products.csv";
    const { data } = await supabase.from("products").select("*, default_supplier:suppliers(name)").order("name");
    rows = (data ?? []).map((p: any) => ({
      Name: p.name,
      SKU: p.sku,
      Category: p.category,
      Unit: p.unit,
      "Default Supplier": p.default_supplier?.name,
    }));
  } else if (type === "orders") {
    filename = "purchase_orders.csv";
    const { data } = await supabase
      .from("purchase_order_items")
      .select("*, product:products(name,sku), purchase_order:purchase_orders(order_number,status,date_ordered,supplier:suppliers(name))")
      .order("created_at", { ascending: false });
    rows = (data ?? []).map((it: any) => ({
      "Order Number": it.purchase_order?.order_number,
      Supplier: it.purchase_order?.supplier?.name,
      Status: it.purchase_order?.status,
      "Date Ordered": it.purchase_order?.date_ordered,
      Product: it.product?.name || it.description,
      SKU: it.product?.sku,
      Quantity: it.quantity,
      "Unit Price RMB": it.unit_price_rmb,
      "Unit Price EUR": it.unit_price_eur,
      "Line Total EUR": it.line_total_eur,
    }));
  } else if (type === "shipments") {
    filename = "shipments.csv";
    const { data } = await supabase.from("shipments").select("*").order("created_at", { ascending: false });
    rows = (data ?? []).map((s) => ({
      Reference: s.reference,
      "Shipping Agent": s.shipping_agent,
      "Tracking Number": s.tracking_number,
      Status: s.status,
      Cartons: s.carton_count,
      "Weight (kg)": s.gross_weight_kg,
      CBM: s.cbm,
      "Date Shipped": s.date_shipped_from_china,
      "Estimated Arrival": s.estimated_arrival,
      "Actual Arrival": s.actual_arrival,
    }));
  }

  const csv = Papa.unparse(rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
