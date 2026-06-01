"use client";

import { use } from "react";
import { OnboardingStepLayout } from "@/components/onboarding/onboarding-step";
import { PaymentMixStep } from "@/components/onboarding/payment-mix-step";
import { ProfileStep } from "@/components/onboarding/profile-step";
import { Label } from "@/components/ui/label";
import { INCOME_BANDS, USER_ROLES, type OnboardingStep } from "@/lib/constants";
import { saveOnboardingFields, completeOnboarding } from "@/lib/onboarding/save";
import { createClient } from "@/lib/supabase/client";
import { normalizePhoneE164 } from "@/lib/identity/phone";
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
    return (
      <OnboardingStepLayout
        step="phone"
        title="Verify your phone"
        description="Required for email and Google sign-up — one verified number per account."
        onSave={async (d) => {
          const raw = String(d.phone ?? "");
          const e164 = normalizePhoneE164(raw);
          if (!e164) throw new Error("Invalid phone number");
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          const { data: check } = await supabase.functions.invoke("check-identity", {
            body: { phone: e164, user_id: user?.id },
          });
          if (check && !check.ok) {
            throw new Error("An account already exists for this number");
          }
          await saveOnboardingFields({ phone: e164 });
          await supabase
            .from("users")
            .update({
              phone: e164,
              phone_verified_at: new Date().toISOString(),
            })
            .eq("id", user!.id);
        }}
        skippable={false}
      >
        <div className="space-y-2">
          <Label htmlFor="phone">Nigerian mobile</Label>
          <Input id="phone" name="phone" type="tel" placeholder="08031234567" required />
        </div>
      </OnboardingStepLayout>
    );
  }

  return (
    <OnboardingStepLayout
      step="complete"
      title="You're set"
      description="Bank connect and WhatsApp come in later phases. Head to your dashboard."
      onSave={async () => completeOnboarding()}
      skippable={false}
    >
      <p className="text-sm text-pw-text-secondary">
        Phase 2 will add Mono bank connect. For now, explore your dashboard shells.
      </p>
    </OnboardingStepLayout>
  );
}
