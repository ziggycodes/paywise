import type { SupabaseClient } from "@supabase/supabase-js";
import { createTransactions } from "@/lib/transactions/create";
import type { TransactionInput } from "@/lib/transactions/types";
import type { BankProvider, NormalizedAccount } from "./types";

/**
 * Upsert the connected account and return its internal id. Keyed on
 * (provider, provider_account_id) so re-connecting the same account is a no-op
 * update rather than a duplicate.
 */
export async function upsertBankAccount(
  supabase: SupabaseClient,
  userId: string,
  provider: string,
  account: NormalizedAccount
): Promise<string> {
  const { data, error } = await supabase
    .from("bank_accounts")
    .upsert(
      {
        user_id: userId,
        provider,
        provider_account_id: account.providerAccountId,
        bank_name: account.bankName,
        account_name: account.accountName,
        account_type: account.accountType,
        currency: account.currency,
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "provider,provider_account_id" }
    )
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

/**
 * Full sync for one connected account: pull provider transactions, normalize,
 * and idempotently insert them. Safe to re-run (e.g. on every webhook).
 */
export async function syncAccountTransactions(
  supabase: SupabaseClient,
  provider: BankProvider,
  userId: string,
  providerAccountId: string
): Promise<{ inserted: number; accountId: string }> {
  const account = await provider.getAccount(providerAccountId);
  const accountId = await upsertBankAccount(
    supabase,
    userId,
    provider.id,
    account
  );

  const txns = await provider.getTransactions(providerAccountId);
  const inputs: TransactionInput[] = txns.map((t) => ({
    type: t.type,
    amount: t.amount,
    currency: t.currency,
    date: t.date,
    merchant: t.description,
    source: "mono",
    externalId: t.externalId,
    accountId,
    sourceMetadata: { provider: provider.id, provider_account_id: providerAccountId },
  }));

  const { inserted } = await createTransactions(supabase, userId, inputs);

  await supabase
    .from("bank_accounts")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", accountId);

  return { inserted, accountId };
}
