"use client";

import { useEffect, useState } from "react";
import { OnboardingStepLayout } from "@/components/onboarding/onboarding-step";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { saveOnboardingFields } from "@/lib/onboarding/save";

export function ProfileStep() {
  const [fullName, setFullName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [showEmailField, setShowEmailField] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        setReady(true);
        return;
      }
      setShowEmailField(!data.user.email);
      const meta = data.user.user_metadata as { full_name?: string; name?: string };
      const { data: profile } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", data.user.id)
        .maybeSingle();
      const initial =
        profile?.full_name ?? meta.full_name ?? meta.name ?? "";
      setFullName(initial);
      setReady(true);
    });
  }, []);

  async function handleSave(_data: Record<string, unknown>) {
    void _data;
    const trimmed = fullName.trim();
    if (trimmed.length < 2) {
      setError("Enter your full name (at least 2 characters).");
      throw new Error("validation");
    }
    const fields: Record<string, unknown> = { full_name: trimmed };
    if (showEmailField && contactEmail.trim()) {
      fields.email = contactEmail.trim();
    }
    await saveOnboardingFields(fields);
  }

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-pw-text-secondary">
        Loading…
      </div>
    );
  }

  return (
    <OnboardingStepLayout
      step="profile"
      title="What should we call you?"
      description="We use your name on your dashboard and in reminders."
      onSave={handleSave}
      skippable={false}
    >
      {error && (
        <p className="rounded-md bg-pw-error-bg p-3 text-sm text-pw-error-text">{error}</p>
      )}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            name="full_name"
            value={fullName}
            onChange={(e) => {
              setError(null);
              setFullName(e.target.value);
            }}
            placeholder="Ada Okonkwo"
            required
            minLength={2}
          />
        </div>
        {showEmailField && (
          <div className="space-y-2">
            <Label htmlFor="contact_email">Email (optional)</Label>
            <Input
              id="contact_email"
              name="contact_email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
        )}
      </div>
    </OnboardingStepLayout>
  );
}
