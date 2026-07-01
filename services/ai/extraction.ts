import { callClaudeWithContent } from "./claude";

export type ExtractedTransaction = {
  date: string | null;
  description: string;
  amount: number | null;
  type: "income" | "expense";
  currency: string;
};

export type ExtractedReceipt = {
  merchant: string | null;
  amount: number | null;
  currency: string;
  date: string | null;
  category: string | null;
};

const IMAGE_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/** Pull the first JSON object/array out of a model response, tolerating prose. */
function parseJsonFromText<T>(text: string): T | null {
  const trimmed = text.trim();
  const start = trimmed.search(/[[{]/);
  if (start < 0) return null;
  const open = trimmed[start];
  const close = open === "[" ? "]" : "}";
  const end = trimmed.lastIndexOf(close);
  if (end <= start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

/**
 * Extract transactions from a bank statement PDF. Output is intentionally the
 * same shape the CSV path produces so both feed the same review-and-confirm UI.
 */
export async function extractTransactionsFromPdf(
  base64: string,
  userId?: string,
  defaultCurrency = "NGN"
): Promise<ExtractedTransaction[]> {
  const { text } = await callClaudeWithContent({
    userId,
    operation: "ocr",
    maxTokens: 4096,
    content: [
      {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: base64 },
      },
      {
        type: "text",
        text: `Extract every transaction from this bank statement. Return ONLY a JSON array; each item: {"date":"YYYY-MM-DD","description":string,"amount":number (positive),"type":"income"|"expense","currency":"3-letter code"}. Money in = income, money out = expense. If a currency is not shown, use "${defaultCurrency}". Do not invent rows.`,
      },
    ],
  });

  const parsed = parseJsonFromText<ExtractedTransaction[]>(text);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((r) => r && typeof r === "object")
    .map((r) => ({
      date: r.date ?? null,
      description: String(r.description ?? "").trim(),
      amount: typeof r.amount === "number" ? Math.abs(r.amount) : null,
      type: r.type === "income" ? "income" : "expense",
      currency: (r.currency || defaultCurrency).toUpperCase(),
    }));
}

/** Extract a single receipt's fields from a photo for review before saving. */
export async function extractReceipt(
  base64: string,
  mediaType: string,
  userId?: string
): Promise<ExtractedReceipt | null> {
  if (!IMAGE_MEDIA_TYPES.has(mediaType)) {
    throw new Error("Unsupported image type. Use JPEG, PNG, WebP, or GIF.");
  }

  const { text } = await callClaudeWithContent({
    userId,
    operation: "ocr",
    maxTokens: 512,
    content: [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
          data: base64,
        },
      },
      {
        type: "text",
        text: `Read this receipt. Return ONLY JSON: {"merchant":string,"amount":number,"currency":"3-letter code","date":"YYYY-MM-DD","category":one of [transport,food_delivery,telecom,entertainment,software,office,shopping,professional_services,other_expense]}. Use "NGN" if no currency is shown. If a field is unreadable, use null.`,
      },
    ],
  });

  const parsed = parseJsonFromText<ExtractedReceipt>(text);
  if (!parsed) return null;
  return {
    merchant: parsed.merchant ? String(parsed.merchant).trim() : null,
    amount: typeof parsed.amount === "number" ? Math.abs(parsed.amount) : null,
    currency: (parsed.currency || "NGN").toUpperCase(),
    date: parsed.date ?? null,
    category: parsed.category ?? null,
  };
}
