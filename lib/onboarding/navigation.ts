import { ONBOARDING_STEPS, type OnboardingStep } from "@/lib/constants";

export function getNextOnboardingStep(current: OnboardingStep): OnboardingStep | null {
  const idx = ONBOARDING_STEPS.indexOf(current);
  if (idx < 0 || idx >= ONBOARDING_STEPS.length - 1) return null;
  return ONBOARDING_STEPS[idx + 1] ?? null;
}

/**
 * Fields we can read to decide where an interrupted onboarding should resume.
 * Skippable steps (business/tin/vat) never block resume — only the required
 * steps below do, in the same order as ONBOARDING_STEPS.
 */
export type OnboardingProgress = {
  first_name?: string | null;
  last_name?: string | null;
  role_type?: string | null;
  payment_mix?: string | null;
  income_band?: string | null;
  phone_verified_at?: string | null;
  onboarding_completed?: boolean | null;
};

/**
 * Returns the first incomplete required onboarding step for a profile, or
 * "complete" when everything required is done. Used by login redirects and
 * middleware so users resume where they left off instead of restarting.
 */
export function getResumeOnboardingStep(
  progress: OnboardingProgress | null | undefined
): OnboardingStep {
  if (!progress) return "profile";
  if (!progress.first_name?.trim() || !progress.last_name?.trim()) {
    return "profile";
  }
  if (!progress.role_type?.trim()) return "role";
  if (!progress.payment_mix?.trim()) return "payment-mix";
  if (!progress.income_band?.trim()) return "income-band";
  if (!progress.phone_verified_at) return "phone";
  return "complete";
}
