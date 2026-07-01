"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isLocalSupabase } from "@/lib/auth/supabase-env";

type Props = {
  email: string;
  onVerified: () => void | Promise<void>;
  onBack?: () => void;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function EmailOtpVerify({ email, onVerified, onBack }: Props) {
  const supabase = createClient();
  const localDev = isLocalSupabase();
  const normalizedEmail = useMemo(() => normalizeEmail(email), [email]);

  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function verify() {
    const otp = token.trim();
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: otp,
      type: "signup",
    });
    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      return;
    }
    setLoading(false);
    void onVerified();
  }

  async function resend() {
    setLoading(true);
    setError(null);
    setMessage(null);
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: normalizedEmail,
    });
    if (resendError) setError(resendError.message);
    else {
      setMessage(
        localDev
          ? "OTP sent. Open http://localhost:54324 (Inbucket) to view the email."
          : "OTP sent. Check your email."
      );
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm text-pw-text-secondary">
          Enter the 6-digit code sent to <span className="font-medium text-pw-text">{normalizedEmail}</span>.
        </p>
        {localDev && (
          <p className="text-xs text-pw-text-tertiary">
            Local dev: open <span className="font-medium">http://localhost:54324</span> (Inbucket) to see the email.
          </p>
        )}
      </div>

      {error && (
        <p className="rounded-md bg-pw-error-bg p-3 text-sm text-pw-error-text">{error}</p>
      )}
      {message && (
        <p className="rounded-md bg-pw-success-bg p-3 text-sm text-pw-success-text">{message}</p>
      )}

      <div className="space-y-2">
        <Label htmlFor="email_otp">Email verification code</Label>
        <Input
          id="email_otp"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          value={token}
          onChange={(e) => {
            setError(null);
            setToken(e.target.value);
          }}
          maxLength={6}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void verify()} disabled={loading}>
          Verify email
        </Button>
        <Button type="button" variant="outline" onClick={() => void resend()} disabled={loading}>
          Resend code
        </Button>
        {onBack && (
          <Button type="button" variant="ghost" onClick={onBack} disabled={loading}>
            Back
          </Button>
        )}
      </div>
    </div>
  );
}

