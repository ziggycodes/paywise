export type AccountStatus =
  | "active"
  | "pending_verification"
  | "flagged"
  | "suspended";

export type UserProfile = {
  id: string;
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  onboarding_completed: boolean;
  default_currency: string;
  tax_residency: string;
  has_cac: boolean;
  rc_number: string | null;
  tin: string | null;
  has_bvn_verified: boolean;
  locale: string;
  phone_verified_at: string | null;
  whatsapp_phone: string | null;
  whatsapp_verified_at: string | null;
  bvn_hash: string | null;
  nin_hash: string | null;
  identity_verified_at: string | null;
  identity_provider: string | null;
  identity_verification_status: string | null;
  account_status: AccountStatus;
  role_type: string | null;
  payment_mix: string | null;
  income_band: string | null;
  is_vat_registered: boolean;
  created_at: string;
  updated_at: string;
};

export type OnboardingData = {
  role_type?: string;
  payment_mix?: string;
  income_band?: string;
  has_cac?: boolean;
  rc_number?: string;
  tin?: string;
  tin_unknown?: boolean;
  is_vat_registered?: boolean;
};
