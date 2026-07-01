"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isLocalSupabase } from "@/lib/auth/supabase-env";
import { EmailOtpVerify } from "@/components/auth/email-otp-verify";
import {
  getResumeOnboardingStep,
  type OnboardingProgress,
} from "@/lib/onboarding/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

type Mode = "login" | "signup";

const ONBOARDING_PROGRESS_COLUMNS =
  "onboarding_completed, first_name, last_name, role_type, payment_mix, income_band, phone_verified_at";

/** Resolve where a returning user should land based on saved onboarding progress. */
async function resolvePostAuthPath(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const { data } = await supabase
    .from("users")
    .select(ONBOARDING_PROGRESS_COLUMNS)
    .eq("id", userId)
    .maybeSingle();
  const progress = data as OnboardingProgress | null;
  if (progress?.onboarding_completed) return "/dashboard";
  return `/onboarding/${getResumeOnboardingStep(progress)}`;
}

function isUnconfirmedEmailError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("email not confirmed") ||
    m.includes("not confirmed") ||
    m.includes("confirm your email")
  );
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const supabase = createClient();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingEmailVerification, setPendingEmailVerification] = useState<string | null>(null);

  const localDev = isLocalSupabase();

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (mode === "signup") {
      const fn = firstName.trim();
      const ln = lastName.trim();
      if (fn.length < 2 || ln.length < 2) {
        setError("Enter your first name and last name.");
        setLoading(false);
        return;
      }
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { first_name: fn, last_name: ln },
        },
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (!data.session) {
        setPendingEmailVerification(email.trim());
        setMessage(
          localDev
            ? "We sent a 6-digit code. Open http://localhost:54324 (Inbucket) to view it."
            : "We sent a 6-digit code to your email."
        );
        setLoading(false);
        return;
      }

      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "[auth] signUp returned a session: enable 'Confirm email' in Supabase to require email OTP."
        );
      }
      if (data.user) {
        router.push(await resolvePostAuthPath(supabase, data.user.id));
      } else {
        router.push("/onboarding/profile");
      }
      setLoading(false);
      return;
    }
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });
    if (signInError) {
      setError(signInError.message);
      if (isUnconfirmedEmailError(signInError.message)) {
        setPendingEmailVerification(email.trim());
      }
    } else if (signInData.user) {
      router.push(await resolvePostAuthPath(supabase, signInData.user.id));
    }
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

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{mode === "login" ? "Welcome back" : "Create your account"}</CardTitle>
        <CardDescription>
          Give to Caesar! Keep your own. Sign in with email or Google.
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

        {pendingEmailVerification ? (
          <EmailOtpVerify
            email={pendingEmailVerification}
            onVerified={async () => {
              const {
                data: { user },
              } = await supabase.auth.getUser();
              router.push(
                user
                  ? await resolvePostAuthPath(supabase, user.id)
                  : "/onboarding/profile"
              );
            }}
            onBack={() => {
              setPendingEmailVerification(null);
              setMessage(null);
            }}
          />
        ) : (
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {mode === "signup" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">First name</Label>
                <Input
                  id="first_name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  minLength={2}
                  autoComplete="given-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last name</Label>
                <Input
                  id="last_name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  minLength={2}
                  autoComplete="family-name"
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
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
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {mode === "login" ? "Sign in" : "Sign up with email"}
          </Button>
        </form>
        )}

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

        <p className="text-center text-sm text-pw-text-secondary">
          {mode === "login" ? (
            <>
              New here?{" "}
              <Link
                href="/signup"
                className="cursor-pointer font-medium text-pw-accent hover:underline"
              >
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link
                href="/login"
                className="cursor-pointer font-medium text-pw-accent hover:underline"
              >
                Sign in
              </Link>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
