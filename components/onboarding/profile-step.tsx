"use client";

import { useEffect, useState } from "react";
import { OnboardingStepLayout } from "@/components/onboarding/onboarding-step";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { saveOnboardingFields } from "@/lib/onboarding/save";
import { splitFullName } from "@/lib/user/display-name";

export function ProfileStep() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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
      const meta = data.user.user_metadata as {
        first_name?: string;
        last_name?: string;
        full_name?: string;
        name?: string;
      };
      const { data: profile } = await supabase
        .from("users")
        .select("first_name, last_name, full_name")
        .eq("id", data.user.id)
        .maybeSingle();

      const fn = profile?.first_name ?? meta.first_name ?? "";
      const ln = profile?.last_name ?? meta.last_name ?? "";

      if (fn.trim()) {
        setFirstName(fn.trim());
        setLastName(ln.trim());
      } else {
        const fullName =
          profile?.full_name ?? meta.full_name ?? meta.name ?? "";
        if (fullName.trim()) {
          const split = splitFullName(fullName);
          setFirstName(split.first_name);
          setLastName(split.last_name ?? "");
        }
      }

      setReady(true);
    });
  }, []);

  async function handleSave(_data: Record<string, unknown>) {
    void _data;
    const fn = firstName.trim();
    const ln = lastName.trim();
    if (fn.length < 2 || ln.length < 2) {
      setError("Enter your first name and last name.");
      throw new Error("validation");
    }
    const fields: Record<string, unknown> = {
      first_name: fn,
      last_name: ln,
    };
    if (showEmailField) {
      const email = contactEmail.trim();
      if (!email) {
        setError("Enter your email address.");
        throw new Error("validation");
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError("Enter a valid email address.");
        throw new Error("validation");
      }
      fields.email = email;
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="first_name">First name</Label>
            <Input
              id="first_name"
              name="first_name"
              value={firstName}
              onChange={(e) => {
                setError(null);
                setFirstName(e.target.value);
              }}
              placeholder="Ada"
              required
              minLength={2}
              autoComplete="given-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Last name</Label>
            <Input
              id="last_name"
              name="last_name"
              value={lastName}
              onChange={(e) => {
                setError(null);
                setLastName(e.target.value);
              }}
              placeholder="Okonkwo"
              required
              minLength={2}
              autoComplete="family-name"
            />
          </div>
        </div>
        {showEmailField && (
          <div className="space-y-2">
            <Label htmlFor="contact_email">Email</Label>
            <Input
              id="contact_email"
              name="contact_email"
              type="email"
              value={contactEmail}
              onChange={(e) => {
                setError(null);
                setContactEmail(e.target.value);
              }}
              placeholder="you@example.com"
              required
            />
          </div>
        )}
      </div>
    </OnboardingStepLayout>
  );
}
