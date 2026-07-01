/**
 * FX normalization to NGN.
 *
 * Phase 2 ships a static rate table so every transaction stores an amount_ngn
 * plus the rate and its source (per the plan's "multi-currency from Day 1"
 * principle: never lose the original, always record the rate used). A live
 * CBN/market rate feed replaces STATIC_NGN_RATES in a later phase without
 * changing callers.
 */
export const FX_RATE_SOURCE = "static_v1";

const STATIC_NGN_RATES: Record<string, number> = {
  NGN: 1,
  USD: 1600,
  GBP: 2000,
  EUR: 1750,
};

export function getNgnRate(currency: string): number | null {
  return STATIC_NGN_RATES[currency.toUpperCase()] ?? null;
}

export type NgnConversion = {
  amountNgn: number | null;
  fxRate: number | null;
  fxRateSource: string | null;
};

export function toNgn(amount: number, currency: string): NgnConversion {
  const rate = getNgnRate(currency);
  if (rate === null) {
    return { amountNgn: null, fxRate: null, fxRateSource: null };
  }
  return {
    amountNgn: Math.round(amount * rate * 100) / 100,
    fxRate: rate,
    fxRateSource: FX_RATE_SOURCE,
  };
}
