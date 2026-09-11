export function buildItemRow(purchaseOrderId: string, it: any) {
  const quantity = Number(it.quantity) || 0;
  const unitPriceRmb = it.unit_price_rmb !== undefined && it.unit_price_rmb !== null ? Number(it.unit_price_rmb) : null;
  const unitPriceEur = it.unit_price_eur !== undefined && it.unit_price_eur !== null ? Number(it.unit_price_eur) : null;

  return {
    purchase_order_id: purchaseOrderId,
    product_id: it.product_id || null,
    description: it.description || null,
    quantity,
    unit_price_rmb: unitPriceRmb,
    unit_price_eur: unitPriceEur,
    line_total_rmb: unitPriceRmb !== null ? round2(unitPriceRmb * quantity) : null,
    line_total_eur: unitPriceEur !== null ? round2(unitPriceEur * quantity) : null,
    notes: it.notes || null,
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
