import type { SupabaseClient } from "@supabase/supabase-js";
import type { TransactionType } from "./types";

/** Lowercase + strip noise so "UBER TRIP *NG 123" matches the "uber" entry. */
export function normalizeMerchant(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw
    .toLowerCase()
    .replace(/[0-9]+/g, " ")
    .replace(/[^a-z\s.&-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || null;
}

export type CategoryGuess = {
  merchantNormalized: string | null;
  category: string | null;
  confidence: number | null;
  taxRelevant: boolean;
};

type DictRow = {
  merchant_normalized: string;
  aliases: string[] | null;
  default_category: string;
  tax_relevant_default: boolean;
};

/**
 * Dictionary-first categorization: matches a merchant against the shared
 * merchant_dictionary (exact normalized name, token overlap, or alias). This is
 * the deterministic, zero-cost path; the LLM fallback arrives in Phase 3.
 */
export async function categorizeByDictionary(
  supabase: SupabaseClient,
  rawMerchant: string | null | undefined,
  type: TransactionType
): Promise<CategoryGuess> {
  const normalized = normalizeMerchant(rawMerchant);

  // Income never comes from the (expense-oriented) merchant dictionary.
  if (!normalized || type === "income") {
    return {
      merchantNormalized: normalized,
      category: null,
      confidence: null,
      taxRelevant: type === "expense",
    };
  }

  const { data } = await supabase
    .from("merchant_dictionary")
    .select("merchant_normalized, aliases, default_category, tax_relevant_default");
  const rows = (data as DictRow[] | null) ?? [];

  const tokens = new Set(normalized.split(" ").filter(Boolean));

  for (const row of rows) {
    const candidates = [row.merchant_normalized, ...(row.aliases ?? [])].map((c) =>
      c.toLowerCase()
    );
    for (const candidate of candidates) {
      if (normalized === candidate) {
        return match(row, 0.99);
      }
      if (normalized.includes(candidate) || candidate.includes(normalized)) {
        return match(row, 0.85);
      }
      if (tokens.has(candidate)) {
        return match(row, 0.8);
      }
    }
  }

  return {
    merchantNormalized: normalized,
    category: null,
    confidence: null,
    taxRelevant: true,
  };
}

function match(row: DictRow, confidence: number): CategoryGuess {
  return {
    merchantNormalized: row.merchant_normalized,
    category: row.default_category,
    confidence,
    taxRelevant: row.tax_relevant_default,
  };
}
