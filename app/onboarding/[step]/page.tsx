"use client";

import { use } from "react";
import { OnboardingStepLayout } from "@/components/onboarding/onboarding-step";
import { PaymentMixStep } from "@/components/onboarding/payment-mix-step";
import { PhoneVerificationStep } from "@/components/onboarding/phone-verification-step";
import { ProfileStep } from "@/components/onboarding/profile-step";
import { Label } from "@/components/ui/label";
import { INCOME_BANDS, USER_ROLES, type OnboardingStep } from "@/lib/constants";
import { saveOnboardingFields, completeOnboarding } from "@/lib/onboarding/save";
import { Input } from "@/components/ui/input";
import { notFound } from "next/navigation";

const VALID_STEPS: OnboardingStep[] = [
  "profile",
  "role",
  "payment-mix",
  "income-band",
  "business",
  "tin",
  "vat",
  "phone",
  "complete",
];

export default function OnboardingStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = use(params);
  if (!VALID_STEPS.includes(step as OnboardingStep)) {
    notFound();
  }
  const currentStep = step as OnboardingStep;

  if (currentStep === "profile") {
    return <ProfileStep />;
  }

  if (currentStep === "role") {
    return (
      <OnboardingStepLayout
        step="role"
        title="What do you do?"
        description="This helps us tailor tax brackets and categories."
        onSave={async (d) => saveOnboardingFields(d)}
      >
        <fieldset className="space-y-2">
          {USER_ROLES.map((r) => (
            <label
              key={r.value}
              className="flex cursor-pointer items-center gap-3 rounded-md border border-pw-border px-3 py-2.5 text-sm text-pw-text transition-colors hover:bg-pw-bg-subtle has-[:checked]:border-pw-highlight has-[:checked]:bg-pw-highlight-soft"
            >
              <input type="radio" name="role_type" value={r.value} required />
              {r.label}
            </label>
          ))}
        </fieldset>
      </OnboardingStepLayout>
    );
  }

  if (currentStep === "payment-mix") {
    return <PaymentMixStep />;
  }

  if (currentStep === "income-band") {
    return (
      <OnboardingStepLayout
        step="income-band"
        title="Roughly how much did you earn last year?"
        description="Used for bracket presentation — does not gate features."
        onSave={async (d) => saveOnboardingFields(d)}
      >
        <fieldset className="space-y-2">
          {INCOME_BANDS.map((b) => (
            <label
              key={b.value}
              className="flex cursor-pointer items-center gap-3 rounded-md border border-pw-border px-3 py-2.5 text-sm text-pw-text transition-colors hover:bg-pw-bg-subtle has-[:checked]:border-pw-highlight has-[:checked]:bg-pw-highlight-soft"
            >
              <input type="radio" name="income_band" value={b.value} required />
              {b.label}
            </label>
          ))}
        </fieldset>
      </OnboardingStepLayout>
    );
  }

  if (currentStep === "business") {
    return (
      <OnboardingStepLayout
        step="business"
        title="CAC-registered business?"
        description="Optional — skip if you operate as an individual."
        onSave={async (d) => saveOnboardingFields(d)}
      >
        <fieldset className="space-y-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="radio" name="has_cac" value="yes" />
            Yes — I have RC/BN
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="radio" name="has_cac" value="no" defaultChecked />
            No — individual
          </label>
          <div className="space-y-2">
            <Label htmlFor="rc_number">RC/BN number (optional)</Label>
            <Input id="rc_number" name="rc_number" placeholder="RC123456" />
          </div>
        </fieldset>
      </OnboardingStepLayout>
    );
  }

  if (currentStep === "tin") {
    return (
      <OnboardingStepLayout
        step="tin"
        title="Do you have a TIN?"
        description="If unsure, BVN/NIN often auto-generates one — we can help later."
        onSave={async (d) => saveOnboardingFields(d)}
        skippable
      >
        <fieldset className="space-y-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="radio" name="tin_status" value="yes" />
            Yes
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="radio" name="tin_status" value="no" />
            No
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="radio" name="tin_status" value="unsure" defaultChecked />
            I&apos;m not sure
          </label>
        </fieldset>
        <div className="space-y-2">
          <Label htmlFor="tin">TIN (if you have it)</Label>
          <Input id="tin" name="tin" placeholder="Optional" />
        </div>
      </OnboardingStepLayout>
    );
  }

  if (currentStep === "vat") {
    return (
      <OnboardingStepLayout
        step="vat"
        title="VAT registered?"
        description="Most freelancers are not — threshold is ₦100m turnover."
        onSave={async (d) => saveOnboardingFields(d)}
        skippable
      >
        <fieldset className="space-y-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="radio" name="is_vat_registered" value="yes" />
            Yes
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="radio" name="is_vat_registered" value="no" defaultChecked />
            No
          </label>
        </fieldset>
      </OnboardingStepLayout>
    );
  }

  if (currentStep === "phone") {
    return <PhoneVerificationStep />;
  }

  return (
    <OnboardingStepLayout
      step="complete"
      title="You're set"
      description="Add your first transactions and watch your dashboard come to life."
      onSave={async () => completeOnboarding()}
      skippable={false}
    >
      <p className="text-sm text-pw-text-secondary">
        Next, connect your bank, import a statement, scan a receipt, or add a
        transaction by hand — then head to your dashboard.
      </p>
    </OnboardingStepLayout>
  );
}
