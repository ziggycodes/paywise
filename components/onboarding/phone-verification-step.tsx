"use client";

import { useState } from "react";
import { OnboardingStepLayout } from "@/components/onboarding/onboarding-step";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  sendPhoneVerificationOtp,
  verifyPhoneVerificationOtp,
} from "@/lib/auth/phone-verification";
import { isLocalSupabase } from "@/lib/auth/supabase-env";
import { normalizePhoneE164 } from "@/lib/identity/phone";
import { saveOnboardingFields } from "@/lib/onboarding/save";
import { createClient } from "@/lib/supabase/client";

const RESEND_COOLDOWN_SEC = 60;

export function PhoneVerificationStep() {
  const [otpSent, setOtpSent] = useState(false);
  const [e164, setE164] = useState<string | null>(null);
  const [displayPhone, setDisplayPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const localDev = isLocalSupabase();

  function startResendCooldown() {
    setResendCooldown(RESEND_COOLDOWN_SEC);
    const interval = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  async function checkPhoneAvailable(phone: string, userId: string | undefined) {
    const supabase = createClient();
    const { data: check } = await supabase.functions.invoke("check-identity", {
      body: { phone, user_id: userId },
    });
    if (check && !check.ok) {
      throw new Error("An account already exists for this number");
    }
  }

  async function persistVerifiedPhone(phone: string) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    await saveOnboardingFields({ phone });
    const { error: updateError } = await supabase
      .from("users")
      .update({
        phone,
        phone_verified_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    if (updateError) throw updateError;
  }

  if (!otpSent) {
    return (
      <OnboardingStepLayout
        step="phone"
        title="Verify your phone"
        description="We'll send a 6-digit code to your Nigerian mobile number."
        onSave={async (d) => {
          setError(null);
          const raw = String(d.phone ?? "");
          const normalized = normalizePhoneE164(raw);
          if (!normalized) {
            setError("Enter a valid Nigerian mobile number.");
            throw new Error("validation");
          }

          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();

          try {
            await checkPhoneAvailable(normalized, user?.id);
            await sendPhoneVerificationOtp(normalized);
          } catch (err) {
            const msg =
              err instanceof Error ? err.message : "Could not send verification code.";
            setError(msg);
            throw new Error("validation");
          }

          setE164(normalized);
          setDisplayPhone(raw.trim() || normalized);
          setOtpSent(true);
          startResendCooldown();
          throw new Error("validation");
        }}
        skippable={false}
      >
        {error && (
          <p className="rounded-md bg-pw-error-bg p-3 text-sm text-pw-error-text">{error}</p>
        )}
        <div className="space-y-2">
          <Label htmlFor="phone">Nigerian mobile</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="08031234567"
            required
            autoComplete="tel"
          />
        </div>
      </OnboardingStepLayout>
    );
  }

  return (
    <OnboardingStepLayout
      step="phone"
      title="Enter verification code"
      description={`We sent a 6-digit code to ${displayPhone || e164}.`}
      onSave={async (d) => {
        setError(null);
        const token = String(d.otp ?? "").trim();
        if (!e164) {
          setError("Session expired. Go back and request a new code.");
          throw new Error("validation");
        }
        if (!/^\d{6}$/.test(token)) {
          setError("Enter the 6-digit code from your SMS.");
          throw new Error("validation");
        }

        try {
          await verifyPhoneVerificationOtp(e164, token);
          await persistVerifiedPhone(e164);
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Invalid or expired code. Try again.";
          setError(msg);
          throw new Error("validation");
        }
      }}
      skippable={false}
    >
      {error && (
        <p className="rounded-md bg-pw-error-bg p-3 text-sm text-pw-error-text">{error}</p>
      )}
      <div className="space-y-2">
        <Label htmlFor="otp">Verification code</Label>
        <Input
          id="otp"
          name="otp"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          maxLength={6}
          pattern="\d{6}"
          required
        />
        {localDev && (
          <p className="text-xs text-pw-text-tertiary">
            Dev: use OTP <strong>123456</strong> for test numbers in README (e.g. 08031234567).
          </p>
        )}
      </div>
      <div className="pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={resendCooldown > 0}
          onClick={() => {
            if (!e164 || resendCooldown > 0) return;
            setError(null);
            void sendPhoneVerificationOtp(e164)
              .then(() => startResendCooldown())
              .catch((err) => {
                setError(
                  err instanceof Error ? err.message : "Could not resend code."
                );
              });
          }}
        >
          {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-2"
          onClick={() => {
            setOtpSent(false);
            setE164(null);
            setError(null);
            setResendCooldown(0);
          }}
        >
          Change number
        </Button>
      </div>
    </OnboardingStepLayout>
  );
}
