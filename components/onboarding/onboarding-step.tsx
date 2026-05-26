"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { trackOnboarding, identifyUser } from "@/lib/analytics/posthog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { OnboardingStep } from "@/lib/constants";
import { ONBOARDING_STEPS } from "@/lib/constants";

type Props = {
  step: OnboardingStep;
  title: string;
  description: string;
  children: React.ReactNode;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  skippable?: boolean;
};

export function OnboardingStepLayout({
  step,
  title,
  description,
  children,
  onSave,
  skippable = true,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const stepIndex = ONBOARDING_STEPS.indexOf(step);
  const progress = Math.round(((stepIndex + 1) / ONBOARDING_STEPS.length) * 100);

  useEffect(() => {
    trackOnboarding("onboarding_step_viewed", step);
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) identifyUser(data.user.id);
    });
  }, [step]);

  async function handleContinue(formData: Record<string, unknown>) {
    setLoading(true);
    try {
      await onSave(formData);
      trackOnboarding("onboarding_step_completed", step);
      const next = ONBOARDING_STEPS[stepIndex + 1];
      if (next) router.push(`/onboarding/${next}`);
      else router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    trackOnboarding("onboarding_dropped", step, { skipped: true });
    const next = ONBOARDING_STEPS[stepIndex + 1];
    if (next) router.push(`/onboarding/${next}`);
    else router.push("/dashboard");
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-pw-bg-subtle">
          <div
            className="h-full rounded-full bg-pw-cta transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-pw-text-tertiary">
          Step {stepIndex + 1} of {ONBOARDING_STEPS.length}
        </p>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const data: Record<string, unknown> = {};
            fd.forEach((v, k) => {
              data[k] = v;
            });
            void handleContinue(data);
          }}
        >
          {children}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading}>
              Continue
            </Button>
            {skippable && (
              <Button type="button" variant="ghost" onClick={handleSkip} disabled={loading}>
                Skip
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
