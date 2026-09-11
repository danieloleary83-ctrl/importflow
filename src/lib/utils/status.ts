import type { OrderStatus, ProblemStatus } from "@/lib/types/database";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  ordered: "Ordered",
  supplier_preparing: "Supplier Preparing",
  ready_for_collection: "Ready for Collection",
  collected: "Collected",
  at_china_warehouse: "At China Warehouse",
  consolidated: "Consolidated",
  shipped: "Shipped",
  in_transit: "In Transit",
  customs: "Customs",
  arrived_ireland: "Arrived Ireland",
  delivered: "Delivered",
  problem: "Problem",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_LIST = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

export function orderStatusColor(status: OrderStatus): string {
  switch (status) {
    case "delivered":
      return "bg-green-100 text-green-800";
    case "problem":
      return "bg-red-100 text-red-800";
    case "cancelled":
      return "bg-neutral-200 text-neutral-600";
    case "in_transit":
    case "shipped":
    case "customs":
      return "bg-blue-100 text-blue-800";
    case "arrived_ireland":
      return "bg-gold/20 text-gold-dark";
    default:
      return "bg-neutral-100 text-neutral-700";
  }
}

export const PROBLEM_STATUS_LABELS: Record<ProblemStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  refunded: "Refunded",
  replaced: "Replaced",
  closed_no_action: "Closed (No Action)",
};

export function problemStatusColor(status: ProblemStatus): string {
  switch (status) {
    case "open":
      return "bg-red-100 text-red-800";
    case "in_progress":
      return "bg-amber-100 text-amber-800";
    case "resolved":
    case "refunded":
    case "replaced":
      return "bg-green-100 text-green-800";
    default:
      return "bg-neutral-100 text-neutral-700";
  }
}

export const PROBLEM_TYPE_LABELS: Record<string, string> = {
  missing_goods: "Missing Goods",
  wrong_quantity: "Wrong Quantity",
  wrong_product: "Wrong Product",
  damaged_goods: "Damaged Goods",
  faulty_goods: "Faulty Goods",
  supplier_dispute: "Supplier Dispute",
  shipping_dispute: "Shipping Dispute",
};

export const COST_TYPE_LABELS: Record<string, string> = {
  china_domestic_shipping: "China Domestic Shipping",
  international_freight: "International Freight",
  customs_duty: "Customs Duty",
  import_vat: "Import VAT",
  other: "Other",
};
