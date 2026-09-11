import type { CostAllocationMethod } from "@/lib/types/database";

export interface LandedCostLine {
  purchase_order_item_id: string;
  product_id: string | null;
  quantity: number;
  line_total_eur: number;
  weight_kg?: number | null;
  cbm?: number | null;
}

export interface LandedCostInput {
  /** Items on a single purchase order (or across POs in one shipment) */
  lines: LandedCostLine[];
  /** Extra costs to allocate across the lines: domestic shipping, freight, customs, VAT, other */
  totalAllocatableCostsEur: number;
  method: CostAllocationMethod;
  /** Only used when method === "manual": eur amount per purchase_order_item_id */
  manualAllocationEur?: Record<string, number>;
}

export interface LandedCostResult {
  purchase_order_item_id: string;
  product_id: string | null;
  quantity: number;
  product_cost_eur: number;
  allocated_cost_eur: number;
  landed_cost_eur: number;
  landed_cost_per_unit_eur: number;
}

/**
 * Spreads freight/customs/other costs across a set of order lines using the
 * chosen allocation method, and returns the true landed cost per line and
 * per unit. This is the core "true landed cost" calculation for the app.
 */
export function calculateLandedCost(input: LandedCostInput): LandedCostResult[] {
  const { lines, totalAllocatableCostsEur, method, manualAllocationEur } = input;

  if (lines.length === 0) return [];

  const weightBasis = (l: LandedCostLine) => l.weight_kg ?? 0;
  const cbmBasis = (l: LandedCostLine) => l.cbm ?? 0;

  let basisTotal = 0;
  let basisFor: (l: LandedCostLine) => number;

  switch (method) {
    case "quantity":
      basisFor = (l) => l.quantity;
      break;
    case "weight":
      basisFor = weightBasis;
      break;
    case "cbm":
      basisFor = cbmBasis;
      break;
    case "manual":
      basisFor = () => 0; // unused, handled separately below
      break;
    case "value":
    default:
      basisFor = (l) => l.line_total_eur;
      break;
  }

  if (method !== "manual") {
    basisTotal = lines.reduce((sum, l) => sum + basisFor(l), 0);
  }

  return lines.map((line) => {
    let allocated: number;

    if (method === "manual") {
      allocated = manualAllocationEur?.[line.purchase_order_item_id] ?? 0;
    } else if (basisTotal <= 0) {
      // Fall back to an even split if the chosen basis has no data
      allocated = totalAllocatableCostsEur / lines.length;
    } else {
      allocated = (basisFor(line) / basisTotal) * totalAllocatableCostsEur;
    }

    const landed = line.line_total_eur + allocated;
    const perUnit = line.quantity > 0 ? landed / line.quantity : 0;

    return {
      purchase_order_item_id: line.purchase_order_item_id,
      product_id: line.product_id,
      quantity: line.quantity,
      product_cost_eur: line.line_total_eur,
      allocated_cost_eur: round2(allocated),
      landed_cost_eur: round2(landed),
      landed_cost_per_unit_eur: round2(perUnit),
    };
  });
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/** Convenience: convert an RMB amount to EUR given an exchange rate (RMB per 1 EUR, or EUR per RMB - see note). */
export function rmbToEur(amountRmb: number, exchangeRate: number, rateIsRmbPerEur = true) {
  if (!exchangeRate) return 0;
  return rateIsRmbPerEur ? amountRmb / exchangeRate : amountRmb * exchangeRate;
}
