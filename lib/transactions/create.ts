import type { SupabaseClient } from "@supabase/supabase-js";
import { categorizeByDictionary } from "./categorize";
import { toNgn } from "./fx";
import type { TransactionInput } from "./types";

/** Build a fully-normalized transactions row from user/provider input. */
async function buildRow(
  supabase: SupabaseClient,
  userId: string,
  input: TransactionInput
) {
  const currency = input.currency.toUpperCase();
  const { amountNgn, fxRate, fxRateSource } = toNgn(input.amount, currency);

  // Only ask the dictionary when a category was not supplied by the user/source.
  let category = input.category ?? null;
  let merchantNormalized: string | null = null;
  let categoryConfidence: number | null = null;
  let taxRelevant = input.taxRelevant ?? input.type === "expense";
  let aiCategorized = false;

  if (!category) {
    const guess = await categorizeByDictionary(
      supabase,
      input.merchant,
      input.type
    );
    category = guess.category;
    merchantNormalized = guess.merchantNormalized;
    categoryConfidence = guess.confidence;
    if (input.taxRelevant === undefined) taxRelevant = guess.taxRelevant;
    aiCategorized = false;
  }

  return {
    user_id: userId,
    account_id: input.accountId ?? null,
    amount: input.amount,
    currency,
    amount_ngn: amountNgn,
    fx_rate: fxRate,
    fx_rate_source: fxRateSource,
    merchant_raw: input.merchant ?? null,
    merchant_normalized: merchantNormalized,
    category,
    category_confidence: categoryConfidence,
    ai_categorized: aiCategorized,
    date: input.date,
    transaction_type: input.type,
    source: input.source,
    external_id: input.externalId ?? null,
    source_metadata: input.sourceMetadata ?? {},
    tax_relevant: taxRelevant,
    notes: input.notes ?? null,
  };
}

export type CreateResult = { inserted: number };

/**
 * Normalizes and persists one or more transactions. Rows carrying an
 * externalId are upserted on (user_id, source, external_id) with duplicates
 * ignored, so re-running an import or replaying a webhook never double-counts.
 */
export async function createTransactions(
  supabase: SupabaseClient,
  userId: string,
  inputs: TransactionInput[]
): Promise<CreateResult> {
  if (inputs.length === 0) return { inserted: 0 };

  const rows = await Promise.all(
    inputs.map((input) => buildRow(supabase, userId, input))
  );

  const withExternalId = rows.filter((r) => r.external_id);
  const withoutExternalId = rows.filter((r) => !r.external_id);

  let inserted = 0;

  if (withExternalId.length > 0) {
    // The idempotency index is partial (`where external_id is not null`), which
    // Postgres cannot use as an ON CONFLICT arbiter. Dedup in the app instead:
    // drop rows whose (source, external_id) already exist for this user, then
    // insert the rest. The partial unique index stays as a DB-level backstop, so
    // re-running an import or replaying a webhook never double-counts.
    const externalIds = withExternalId
      .map((r) => r.external_id)
      .filter((id): id is string => !!id);

    const { data: existing, error: lookupError } = await supabase
      .from("transactions")
      .select("source, external_id")
      .eq("user_id", userId)
      .in("external_id", externalIds);
    if (lookupError) throw lookupError;

    const existingKeys = new Set(
      (existing ?? []).map((e) => `${e.source}::${e.external_id}`)
    );
    const newRows = withExternalId.filter(
      (r) => !existingKeys.has(`${r.source}::${r.external_id}`)
    );

    if (newRows.length > 0) {
      const { data, error } = await supabase
        .from("transactions")
        .insert(newRows)
        .select("id");
      if (error) throw error;
      inserted += data?.length ?? 0;
    }
  }

  if (withoutExternalId.length > 0) {
    const { data, error } = await supabase
      .from("transactions")
      .insert(withoutExternalId)
      .select("id");
    if (error) throw error;
    inserted += data?.length ?? 0;
  }

  return { inserted };
}

export async function createTransaction(
  supabase: SupabaseClient,
  userId: string,
  input: TransactionInput
): Promise<CreateResult> {
  return createTransactions(supabase, userId, [input]);
}
