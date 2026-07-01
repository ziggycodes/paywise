import type { TransactionType } from "@/lib/transactions/types";

/**
 * First-band tax-free allowance under the Nigeria Tax Act 2025 (₦800,000).
 * Phase 3 replaces this single number with the full bracket rule pack; for now
 * it powers the "tax-free runway" widget on real income.
 */
export const TAX_FREE_THRESHOLD_NGN = 800_000;

export type SummaryRow = {
  amount_ngn: number | null;
  transaction_type: TransactionType;
  tax_relevant: boolean;
  date: string;
};

export type DashboardSummary = {
  incomeThisMonthNgn: number;
  expensesThisMonthNgn: number;
  grossIncomeYtdNgn: number;
  deductibleExpensesYtdNgn: number;
  taxFreeRunwayNgn: number;
  crossedThreshold: boolean;
  hasData: boolean;
};

function ngn(row: SummaryRow): number {
  return row.amount_ngn ?? 0;
}

export function computeDashboardSummary(
  rows: SummaryRow[],
  now = new Date()
): DashboardSummary {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  let incomeThisMonthNgn = 0;
  let expensesThisMonthNgn = 0;
  let grossIncomeYtdNgn = 0;
  let deductibleExpensesYtdNgn = 0;

  for (const row of rows) {
    const d = new Date(`${row.date}T00:00:00Z`);
    if (Number.isNaN(d.getTime()) || d.getUTCFullYear() !== year) continue;

    const value = ngn(row);
    const sameMonth = d.getUTCMonth() === month;

    if (row.transaction_type === "income") {
      grossIncomeYtdNgn += value;
      if (sameMonth) incomeThisMonthNgn += value;
    } else {
      if (row.tax_relevant) deductibleExpensesYtdNgn += value;
      if (sameMonth) expensesThisMonthNgn += value;
    }
  }

  const taxFreeRunwayNgn = Math.max(
    0,
    TAX_FREE_THRESHOLD_NGN - grossIncomeYtdNgn
  );

  return {
    incomeThisMonthNgn,
    expensesThisMonthNgn,
    grossIncomeYtdNgn,
    deductibleExpensesYtdNgn,
    taxFreeRunwayNgn,
    crossedThreshold: grossIncomeYtdNgn > TAX_FREE_THRESHOLD_NGN,
    hasData: rows.length > 0,
  };
}

/** Next 31 March personal income tax filing deadline. */
export function nextFilingDeadline(now = new Date()): Date {
  const year = now.getUTCFullYear();
  const thisYear = new Date(Date.UTC(year, 2, 31));
  return now <= thisYear ? thisYear : new Date(Date.UTC(year + 1, 2, 31));
}

export function daysUntil(target: Date, now = new Date()): number {
  const ms = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}
