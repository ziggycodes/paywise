import { createClient } from "@supabase/supabase-js";

export type CostLedgerEntry = {
  userId?: string;
  model: string;
  operation: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens?: number;
  batch?: boolean;
  costUsd: number;
};

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key);
}

export async function logAiCost(entry: CostLedgerEntry): Promise<void> {
  const supabase = getServiceClient();
  if (!supabase) {
    console.warn("[ai_cost_ledger] Skipped — missing service role key");
    return;
  }

  const { error } = await supabase.from("ai_cost_ledger").insert({
    user_id: entry.userId ?? null,
    model: entry.model,
    operation: entry.operation,
    input_tokens: entry.inputTokens,
    output_tokens: entry.outputTokens,
    cached_tokens: entry.cachedTokens ?? 0,
    batch: entry.batch ?? false,
    cost_usd: entry.costUsd,
  });

  if (error) {
    console.error("[ai_cost_ledger]", error.message);
  }
}

/** Haiku 4.5 approximate pricing (USD per token) */
export function estimateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cachedTokens = 0
): number {
  const uncachedInput = Math.max(0, inputTokens - cachedTokens);
  const rates: Record<string, { input: number; output: number; cached: number }> =
    {
      "claude-haiku-4-5": { input: 1e-6, output: 5e-6, cached: 0.1e-6 },
      "claude-sonnet-4-6": { input: 3e-6, output: 15e-6, cached: 0.3e-6 },
      "claude-opus-4-7": { input: 5e-6, output: 25e-6, cached: 0.5e-6 },
    };
  const rate = rates[model] ?? rates["claude-haiku-4-5"];
  return (
    uncachedInput * rate.input +
    cachedTokens * rate.cached +
    outputTokens * rate.output
  );
}
