export interface CashGpayTotals {
  cash: number;
  gpay: number;
}

// Handles both new split-payment records (cashPortion/gpayPortion) and
// old pre-split records (paymentMethod + finalAmount) transparently.
export function computeCashGpayTotals(sales: any[]): CashGpayTotals {
  let cash = 0, gpay = 0;
  sales.forEach((t) => {
    if (t.cashPortion !== undefined) {
      cash += t.cashPortion;
      gpay += t.gpayPortion;
    } else if (t.paymentMethod === 'gpay') {
      gpay += t.finalAmount;
    } else {
      cash += t.finalAmount;
    }
  });
  return { cash, gpay };
}

// Nets returns against the day/method the ORIGINAL sale used (not today's date),
// since that's when the revenue was actually recorded.
export function applyReturnsToTotals(totals: CashGpayTotals, sales: any[], returns: any[]): CashGpayTotals {
  let { cash, gpay } = totals;
  returns.forEach((r) => {
    const original = sales.find((s) => s.id === r.originalTransactionId);
    if (!original) return;
    const method = r.refundMethod || original.paymentMethod;
    if (method === 'gpay') gpay -= r.refundAmount;
    else cash -= r.refundAmount;
  });
  return { cash, gpay };
}

export function computeDiscountTotal(sales: any[]): number {
  return sales.reduce((sum, t) => sum + (t.discount || 0), 0);
}

export function computeExpenseBreakdown(expenses: any[]): { byDesc: Record<string, number>; total: number } {
  const byDesc: Record<string, number> = {};
  expenses.forEach((e) => {
    const key = e.description.trim();
    byDesc[key] = (byDesc[key] || 0) + e.amount;
  });
  const total = Object.values(byDesc).reduce((s, v) => s + v, 0);
  return { byDesc, total };
}

export function computeStockMovementByProduct(transactions: any[]): Record<string, { qty: number; unit: string }> {
  const byProduct: Record<string, { qty: number; unit: string }> = {};
  transactions.forEach((t) => {
    const key = t.subVarietyName;
    if (!byProduct[key]) byProduct[key] = { qty: 0, unit: t.unit };
    byProduct[key].qty += t.quantity;
  });
  return byProduct;
}

export function rankProductsByQuantity(sales: any[]): [string, number][] {
  const byProduct: Record<string, number> = {};
  sales.forEach((t) => { byProduct[t.subVarietyName] = (byProduct[t.subVarietyName] || 0) + t.quantity; });
  return Object.entries(byProduct).sort((a, b) => b[1] - a[1]);
}

// Excludes voided bills — every screen that sums sales should filter through this first.
export function excludeVoided(transactions: any[]): any[] {
  return transactions.filter((t) => !t.voided);
}

// Splits `totalToSplit` proportionally across items by `weights`, guaranteeing
// the results sum to EXACTLY totalToSplit (no floating-point drift) by having
// the last item absorb whatever rounding remainder is left over.
export function splitProportionally(weights: number[], totalToSplit: number): number[] {
  if (weights.length === 0) return [];
  const totalWeight = weights.reduce((s, w) => s + w, 0);
  const result: number[] = [];
  let allocated = 0;
  weights.forEach((w, i) => {
    if (i === weights.length - 1) {
      result.push(Number((totalToSplit - allocated).toFixed(2)));
    } else {
      const share = totalWeight > 0 ? w / totalWeight : 0;
      const amt = Number((totalToSplit * share).toFixed(2));
      result.push(amt);
      allocated += amt;
    }
  });
  return result;
}