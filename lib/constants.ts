export const ONBOARDING_STEPS = [
  "profile",
  "role",
  "payment-mix",
  "income-band",
  "business",
  "tin",
  "vat",
  "phone",
  "complete",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const INCOME_BANDS = [
  { value: "under_800k", label: "Under ₦800k" },
  { value: "800k_3m", label: "₦800k – ₦3m" },
  { value: "3m_12m", label: "₦3m – ₦12m" },
  { value: "12m_50m", label: "₦12m – ₦50m" },
  { value: "over_50m", label: "Over ₦50m" },
] as const;

export const USER_ROLES = [
  { value: "freelancer", label: "Freelancer" },
  { value: "creator", label: "Creator" },
  { value: "agency", label: "Agency" },
  { value: "small_business", label: "Small business owner" },
  { value: "mixed", label: "Mixed" },
] as const;

export const PAYMENT_MIX = [
  { value: "ngn_bank", label: "Nigerian bank transfer" },
  { value: "usd_platforms", label: "USD via Wise, Payoneer, Deel" },
  { value: "upwork", label: "Upwork" },
  { value: "fiverr", label: "Fiverr" },
  { value: "crypto", label: "Crypto" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other" },
] as const;
