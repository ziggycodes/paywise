import Anthropic from "@anthropic-ai/sdk";
import { buildCachedSystemBlocks } from "./caching";
import { estimateCostUsd, logAiCost } from "./cost-ledger";

export type AiOperation =
  | "health_check"
  | "categorize"
  | "assistant"
  | "ocr"
  | "anomaly";

export type ClaudeCallOptions = {
  userId?: string;
  operation: AiOperation;
  model?: string;
  maxTokens?: number;
  userMessage: string;
};

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Store in Supabase Vault for production."
    );
  }
  if (!client) {
    client = new Anthropic({ apiKey });
  }
  return client;
}

export async function callClaude(
  options: ClaudeCallOptions
): Promise<{ text: string; usage: { input: number; output: number; cached: number } }> {
  const anthropic = getClient();
  const model = options.model ?? DEFAULT_MODEL;

  const response = await anthropic.messages.create({
    model,
    max_tokens: options.maxTokens ?? 256,
    system: buildCachedSystemBlocks(),
    messages: [{ role: "user", content: options.userMessage }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const text = textBlock && textBlock.type === "text" ? textBlock.text : "";

  const input = response.usage.input_tokens;
  const output = response.usage.output_tokens;
  const cached =
    (response.usage as { cache_read_input_tokens?: number })
      .cache_read_input_tokens ?? 0;

  const costUsd = estimateCostUsd(model, input, output, cached);
  await logAiCost({
    userId: options.userId,
    model,
    operation: options.operation,
    inputTokens: input,
    outputTokens: output,
    cachedTokens: cached,
    costUsd,
  });

  return { text, usage: { input, output, cached } };
}

/** Phase 1 health check — verifies SDK + ledger wiring */
export async function runAiHealthCheck(userId?: string): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    const { text } = await callClaude({
      userId,
      operation: "health_check",
      userMessage: 'Reply with exactly: "PayWise AI online"',
      maxTokens: 32,
    });
    return { ok: text.toLowerCase().includes("paywise"), message: text };
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI health check failed";
    return { ok: false, message };
  }
}
