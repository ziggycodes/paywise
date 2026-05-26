/** Model router — Haiku → Sonnet → Opus (Phase 3+ full implementation) */

export type ModelTier = "haiku" | "sonnet" | "opus";

const MODEL_IDS: Record<ModelTier, string> = {
  haiku: "claude-haiku-4-5-20251001",
  sonnet: "claude-sonnet-4-6-20250514",
  opus: "claude-opus-4-7-20250514",
};

export function selectModel(
  operation: string,
  confidence?: number
): string {
  if (operation === "assistant" || operation === "tax_explain") {
    return MODEL_IDS.sonnet;
  }
  if (confidence !== undefined && confidence < 0.5) {
    return MODEL_IDS.opus;
  }
  return MODEL_IDS.haiku;
}
