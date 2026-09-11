// Hand-written types matching supabase/migrations/0001_init.sql.
// If you change the SQL schema, update this file to match.

export type OrderStatus =
  | "ordered"
  | "supplier_preparing"
  | "ready_for_collection"
  | "collected"
  | "at_china_warehouse"
  | "consolidated"
  | "shipped"
  | "in_transit"
  | "customs"
  | "arrived_ireland"
  | "delivered"
  | "problem"
  | "cancelled";

export type CostType =
  | "china_domestic_shipping"
  | "international_freight"
  | "customs_duty"
  | "import_vat"
  | "other";

export type CostAllocationMethod = "quantity" | "weight" | "cbm" | "value" | "manual";

export type AttachmentEntityType =
  | "supplier"
  | "product"
  | "purchase_order"
  | "shipment"
  | "problem";

export type ProblemType =
  | "missing_goods"
  | "wrong_quantity"
  | "wrong_product"
  | "damaged_goods"
  | "faulty_goods"
  | "supplier_dispute"
  | "shipping_dispute";

export type ProblemStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "refunded"
  | "replaced"
  | "closed_no_action";

export interface Supplier {
  id: string;
  name: string;
  company_name: string | null;
  contact_person: string | null;
  phone: string | null;
  wechat: string | null;
  whatsapp: string | null;
  link_1688: string | null;
  alibaba_url: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupplierStats {
  supplier_id: string;
  total_orders: number;
  total_spend_eur: number;
  avg_lead_time_days: number | null;
  open_problems: number;
  total_problems: number;
}

export interface Product {
  id: string;
  sku: string | null;
  name: string;
  description: string | null;
  category: string | null;
  unit: string | null;
  default_supplier_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: string;
  order_number: string | null;
  supplier_id: string;
  status: OrderStatus;
  currency: string;
  exchange_rate: number | null;
  date_ordered: string | null;
  date_dispatched: string | null;
  date_received_at_warehouse: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string | null;
  description: string | null;
  quantity: number;
  unit_price_rmb: number | null;
  unit_price_eur: number | null;
  line_total_rmb: number | null;
  line_total_eur: number | null;
  notes: string | null;
  created_at: string;
}

export interface Shipment {
  id: string;
  reference: string | null;
  shipping_agent: string | null;
  shipping_method: string | null;
  tracking_number: string | null;
  status: OrderStatus;
  warehouse: string | null;
  shipping_mark: string | null;
  carton_count: number | null;
  carton_dimensions: string | null;
  gross_weight_kg: number | null;
  cbm: number | null;
  cost_allocation_method: CostAllocationMethod;
  date_shipped_from_china: string | null;
  estimated_arrival: string | null;
  actual_arrival: string | null;
  date_delivered: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShipmentItem {
  id: string;
  shipment_id: string;
  purchase_order_id: string;
  purchase_order_item_id: string | null;
  quantity: number | null;
  allocated_shipping_cost_eur: number | null;
  notes: string | null;
  created_at: string;
}

export interface Cost {
  id: string;
  purchase_order_id: string | null;
  shipment_id: string | null;
  cost_type: CostType;
  description: string | null;
  amount: number;
  currency: string;
  amount_eur: number;
  date_incurred: string | null;
  created_at: string;
}

export interface TrackingUpdate {
  id: string;
  shipment_id: string;
  status: string | null;
  location: string | null;
  note: string | null;
  event_date: string | null;
  source: string | null;
  created_at: string;
}

export interface Attachment {
  id: string;
  entity_type: AttachmentEntityType;
  entity_id: string;
  file_path: string;
  file_name: string | null;
  file_type: string | null;
  notes: string | null;
  uploaded_at: string;
}

export interface ProblemClaim {
  id: string;
  purchase_order_id: string | null;
  shipment_id: string | null;
  supplier_id: string | null;
  product_id: string | null;
  type: ProblemType;
  description: string;
  status: ProblemStatus;
  resolution: string | null;
  refund_amount: number | null;
  refund_currency: string | null;
  replacement_order_id: string | null;
  date_reported: string;
  date_resolved: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductCostHistoryRow {
  product_id: string;
  purchase_order_id: string;
  order_number: string | null;
  supplier_name: string;
  date_ordered: string | null;
  quantity: number;
  unit_price_rmb: number | null;
  unit_price_eur: number | null;
  line_total_eur: number | null;
}

export interface PurchaseOrderCostSummary {
  purchase_order_id: string;
  items_total_eur: number;
  direct_costs_eur: number;
  allocated_shipping_eur: number;
}

type TableDef<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
};

export interface Database {
  public: {
    Tables: {
      suppliers: TableDef<Supplier>;
      products: TableDef<Product>;
      purchase_orders: TableDef<PurchaseOrder>;
      purchase_order_items: TableDef<PurchaseOrderItem>;
      shipments: TableDef<Shipment>;
      shipment_items: TableDef<ShipmentItem>;
      costs: TableDef<Cost>;
      tracking_updates: TableDef<TrackingUpdate>;
      attachments: TableDef<Attachment>;
      problems_claims: TableDef<ProblemClaim>;
    };
    Views: {
      supplier_stats: { Row: SupplierStats };
      purchase_order_cost_summary: { Row: PurchaseOrderCostSummary };
      product_cost_history: { Row: ProductCostHistoryRow };
    };
  };
}
