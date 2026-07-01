export type TransactionType = "income" | "expense";

export type TransactionSource =
  | "manual"
  | "mono"
  | "csv"
  | "receipt"
  | "sms"
  | "whatsapp";

/**
 * Category taxonomy — mirrors services/ai/caching.ts CATEGORY_TAXONOMY_BLOCK so
 * dictionary lookups, manual entry, and (Phase 3) LLM categorization all agree.
 */
export const INCOME_CATEGORIES = [
  { value: "client_payment_ngn", label: "Client payment (NGN)" },
  { value: "client_payment_foreign", label: "Client payment (foreign)" },
  { value: "creator_payout", label: "Creator payout" },
  { value: "affiliate", label: "Affiliate" },
  { value: "salary", label: "Salary" },
  { value: "investment", label: "Investment" },
  { value: "other_income", label: "Other income" },
] as const;

export const EXPENSE_CATEGORIES = [
  { value: "transport", label: "Transport" },
  { value: "food_delivery", label: "Food & delivery" },
  { value: "telecom", label: "Telecom & data" },
  { value: "entertainment", label: "Entertainment" },
  { value: "software", label: "Software & subscriptions" },
  { value: "office", label: "Office & rent" },
  { value: "shopping", label: "Shopping & supplies" },
  { value: "fx_transfer", label: "FX & transfer fees" },
  { value: "professional_services", label: "Professional services" },
  { value: "tax_payment", label: "Tax payment" },
  { value: "other_expense", label: "Other expense" },
] as const;

export type IncomeCategory = (typeof INCOME_CATEGORIES)[number]["value"];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]["value"];

export const SUPPORTED_CURRENCIES = ["NGN", "USD", "GBP", "EUR"] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

/** User-facing input, before normalization (FX + categorization + amount_ngn). */
export type TransactionInput = {
  type: TransactionType;
  amount: number;
  currency: string;
  date: string; // YYYY-MM-DD
  merchant?: string | null;
  category?: string | null;
  notes?: string | null;
  taxRelevant?: boolean;
  source: TransactionSource;
  externalId?: string | null;
  sourceMetadata?: Record<string, unknown>;
  accountId?: string | null;
};

/** Row shape read back from the transactions table for display. */
export type TransactionRow = {
  id: string;
  account_id: string | null;
  amount: number;
  currency: string;
  amount_ngn: number | null;
  merchant_raw: string | null;
  merchant_normalized: string | null;
  category: string | null;
  category_confidence: number | null;
  ai_categorized: boolean;
  user_corrected: boolean;
  date: string;
  transaction_type: TransactionType;
  source: TransactionSource;
  tax_relevant: boolean;
  notes: string | null;
  created_at: string;
};

export function categoryLabel(value: string | null | undefined): string {
  if (!value) return "Uncategorized";
  const all = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
  return all.find((c) => c.value === value)?.label ?? value;
}
