import type { TransactionType } from "@/lib/transactions/types";

/** Provider-agnostic account, normalized from a raw provider payload. */
export type NormalizedAccount = {
  providerAccountId: string;
  bankName: string | null;
  accountName: string | null;
  accountType: string | null;
  currency: string;
};

/** Provider-agnostic transaction, ready to become a TransactionInput. */
export type NormalizedTransaction = {
  externalId: string;
  amount: number;
  currency: string;
  date: string; // YYYY-MM-DD
  description: string | null;
  type: TransactionType;
};

/**
 * A bank data provider (Mono today; Okra/Stitch later share this contract).
 * Keeps API/webhook specifics out of the ingestion routes.
 */
export interface BankProvider {
  readonly id: string;
  /** Exchange the widget's short-lived code for a durable account id. */
  exchangeToken(code: string): Promise<string>;
  getAccount(providerAccountId: string): Promise<NormalizedAccount>;
  getTransactions(providerAccountId: string): Promise<NormalizedTransaction[]>;
  /** Validate a webhook payload's authenticity before we trust it. */
  verifyWebhook(headers: Headers, rawBody: string): boolean;
}
