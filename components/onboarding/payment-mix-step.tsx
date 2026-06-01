"use client";

import { useState } from "react";
import { OnboardingStepLayout } from "@/components/onboarding/onboarding-step";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PAYMENT_MIX } from "@/lib/constants";
import { saveOnboardingFields } from "@/lib/onboarding/save";

export function PaymentMixStep() {
  const [selected, setSelected] = useState<string[]>([]);
  const [otherText, setOtherText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function toggleChannel(value: string) {
    setError(null);
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  async function handleSave(_data: Record<string, unknown>) {
    void _data;
    if (selected.length === 0) {
      setError("Select at least one payment channel.");
      throw new Error("validation");
    }
    if (selected.includes("other") && !otherText.trim()) {
      setError("Describe how you get paid when selecting Other.");
      throw new Error("validation");
    }

    const payload = {
      channels: selected,
      ...(selected.includes("other") && otherText.trim()
        ? { other: otherText.trim() }
        : {}),
    };
    await saveOnboardingFields({ payment_mix: JSON.stringify(payload) });
  }

  const showOtherInput = selected.includes("other");

  return (
    <OnboardingStepLayout
      step="payment-mix"
      title="How do you get paid?"
      description="Select all that apply — drives FX and worldwide-income logic."
      onSave={handleSave}
    >
      {error && (
        <p className="rounded-md bg-pw-error-bg p-3 text-sm text-pw-error-text">{error}</p>
      )}
      <fieldset className="space-y-2">
        {PAYMENT_MIX.map((p) => (
          <label
            key={p.value}
            className="flex cursor-pointer items-center gap-3 rounded-md border border-pw-border px-3 py-2.5 text-sm text-pw-text transition-colors hover:bg-pw-bg-subtle has-[:checked]:border-pw-highlight has-[:checked]:bg-pw-highlight-soft"
          >
            <input
              type="checkbox"
              name="payment_mix"
              value={p.value}
              checked={selected.includes(p.value)}
              onChange={() => toggleChannel(p.value)}
            />
            {p.label}
          </label>
        ))}
      </fieldset>
      {showOtherInput && (
        <div className="space-y-2">
          <Label htmlFor="payment_mix_other">Other payment methods</Label>
          <Input
            id="payment_mix_other"
            value={otherText}
            onChange={(e) => {
              setError(null);
              setOtherText(e.target.value);
            }}
            placeholder="e.g. PayPal, direct client wire"
          />
        </div>
      )}
    </OnboardingStepLayout>
  );
}
