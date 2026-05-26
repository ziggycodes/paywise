import type Anthropic from "@anthropic-ai/sdk";

/** Stable blocks for prompt caching (§7.3) */
export const PAYWISE_SYSTEM_PROMPT = `You are PayWise, the AI financial copilot for Nigerian freelancers and small business owners.
You help users understand income, expenses, and tax estimates under Nigeria Tax Act 2025.
Never invent transaction amounts. If data is missing, say so clearly.
Respond in clear English; use Nigerian Pidgin only when the user does.`;

export const CATEGORY_TAXONOMY_BLOCK = `Income: client_payment_ngn, client_payment_foreign, creator_payout, affiliate, salary, investment, other.
Expense: transport, food_delivery, telecom, entertainment, software, office, professional_services, tax_payment, other.`;

export function buildCachedSystemBlocks(): Anthropic.Messages.TextBlockParam[] {
  return [
    {
      type: "text",
      text: PAYWISE_SYSTEM_PROMPT,
      cache_control: { type: "ephemeral" },
    },
    {
      type: "text",
      text: CATEGORY_TAXONOMY_BLOCK,
      cache_control: { type: "ephemeral" },
    },
  ];
}
