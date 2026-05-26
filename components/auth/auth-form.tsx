"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { normalizePhoneE164 } from "@/lib/identity/phone";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function checkPhoneCollision(e164: string, userId?: string) {
    const { data, error: fnError } = await supabase.functions.invoke("check-identity", {
      body: { phone: e164, user_id: userId },
    });
    if (fnError) return true;
    if (data && !data.ok) {
      setError("An account already exists for this number. Sign in instead.");
      return false;
    }
    return true;
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      setMessage("Check your email to confirm your account, then sign in.");
      setLoading(false);
      return;
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) setError(signInError.message);
    else router.push("/onboarding/role");
    setLoading(false);
  }

  async function handleGoogle() {
    setLoading(true);
    setError(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (oauthError) setError(oauthError.message);
    setLoading(false);
  }

  async function sendPhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const e164 = normalizePhoneE164(phone);
    if (!e164) {
      setError("Enter a valid Nigerian phone number (e.g. 0803...)");
      setLoading(false);
      return;
    }
    const ok = await checkPhoneCollision(e164);
    if (!ok) {
      setLoading(false);
      return;
    }
    const { error: otpError } = await supabase.auth.signInWithOtp({ phone: e164 });
    if (otpError) setError(otpError.message);
    else {
      setOtpSent(true);
      setMessage("OTP sent. Enter the code below.");
    }
    setLoading(false);
  }

  async function verifyPhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const e164 = normalizePhoneE164(phone);
    if (!e164) {
      setError("Invalid phone number");
      setLoading(false);
      return;
    }
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone: e164,
      token: otp,
      type: "sms",
    });
    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      return;
    }
    if (data.user) {
      await supabase
        .from("users")
        .update({ phone: e164, phone_verified_at: new Date().toISOString(), account_status: "active" })
        .eq("id", data.user.id);
      identifyAndGo(data.user.id, e164);
    }
    setLoading(false);
  }

  function identifyAndGo(userId: string, phoneE164?: string) {
    router.push("/onboarding/role");
    void userId;
    void phoneE164;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{mode === "login" ? "Welcome back" : "Create your account"}</CardTitle>
        <CardDescription>
          Give to Caesar! Keep your own. Sign in with email, Google, or phone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <p className="rounded-md bg-pw-error-bg p-3 text-sm text-pw-error-text">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-md bg-pw-success-bg p-3 text-sm text-pw-success-text">
            {message}
          </p>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {mode === "login" ? "Sign in" : "Sign up with email"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-pw-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-pw-surface px-2 text-pw-text-tertiary">or</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogle}
          disabled={loading}
        >
          Continue with Google
        </Button>

        {!otpSent ? (
          <form onSubmit={sendPhoneOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (OTP)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="08031234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <Button type="submit" variant="outline" className="w-full" disabled={loading}>
              Send OTP
            </Button>
          </form>
        ) : (
          <form onSubmit={verifyPhoneOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">OTP code</Label>
              <Input
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              Verify & continue
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-pw-text-secondary">
          {mode === "login" ? (
            <>
              New here?{" "}
              <Link href="/signup" className="font-medium text-pw-accent hover:underline">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-pw-accent hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
