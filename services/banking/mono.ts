import type {
  BankProvider,
  NormalizedAccount,
  NormalizedTransaction,
} from "./types";

const MONO_BASE_URL = "https://api.withmono.com";

function secretKey(): string {
  const key = process.env.MONO_SECRET_KEY;
  if (!key) throw new Error("MONO_SECRET_KEY is not set.");
  return key;
}

export function isMonoConfigured(): boolean {
  return !!process.env.MONO_SECRET_KEY;
}

async function monoFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${MONO_BASE_URL}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "mono-sec-key": secretKey(),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (json as { message?: string }).message ?? `Mono request failed (${res.status})`;
    throw new Error(message);
  }
  return json as T;
}

type MonoAuthResponse = { id?: string; data?: { id?: string } };
type MonoAccountResponse = {
  account?: {
    institution?: { name?: string };
    name?: string;
    type?: string;
    currency?: string;
  };
  data?: {
    account?: {
      institution?: { name?: string };
      name?: string;
      type?: string;
      currency?: string;
    };
  };
};
type MonoTxn = {
  id?: string;
  _id?: string;
  amount?: number;
  currency?: string;
  date?: string;
  narration?: string;
  type?: string; // "debit" | "credit"
};
type MonoTxnResponse = { data?: MonoTxn[] } | MonoTxn[];

/** Mono stores NGN amounts in kobo; normalize to the major unit. */
function fromKobo(amount: number): number {
  return Math.round(amount) / 100;
}

export class MonoProvider implements BankProvider {
  readonly id = "mono";

  async exchangeToken(code: string): Promise<string> {
    const json = await monoFetch<MonoAuthResponse>("/v2/accounts/auth", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    const id = json.id ?? json.data?.id;
    if (!id) throw new Error("Mono did not return an account id.");
    return id;
  }

  async getAccount(providerAccountId: string): Promise<NormalizedAccount> {
    const json = await monoFetch<MonoAccountResponse>(
      `/v2/accounts/${providerAccountId}`
    );
    const account = json.account ?? json.data?.account ?? {};
    return {
      providerAccountId,
      bankName: account.institution?.name ?? null,
      accountName: account.name ?? null,
      accountType: account.type ?? null,
      currency: (account.currency ?? "NGN").toUpperCase(),
    };
  }

  async getTransactions(
    providerAccountId: string
  ): Promise<NormalizedTransaction[]> {
    const json = await monoFetch<MonoTxnResponse>(
      `/v2/accounts/${providerAccountId}/transactions?paginate=false`
    );
    const list = Array.isArray(json) ? json : (json.data ?? []);
    return list
      .map((t) => normalizeTxn(t))
      .filter((t): t is NormalizedTransaction => t !== null);
  }

  verifyWebhook(headers: Headers): boolean {
    const secret = process.env.MONO_WEBHOOK_SECRET;
    if (!secret) return false;
    // Mono signs webhooks with a shared secret sent in this header.
    return headers.get("mono-webhook-secret") === secret;
  }
}

function normalizeTxn(t: MonoTxn): NormalizedTransaction | null {
  const externalId = t.id ?? t._id;
  if (!externalId || typeof t.amount !== "number" || !t.date) return null;
  const currency = (t.currency ?? "NGN").toUpperCase();
  const amount = currency === "NGN" ? fromKobo(t.amount) : t.amount;
  return {
    externalId,
    amount: Math.abs(amount),
    currency,
    date: t.date.slice(0, 10),
    description: t.narration ?? null,
    type: t.type === "credit" ? "income" : "expense",
  };
}

export const monoProvider = new MonoProvider();
