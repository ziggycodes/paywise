import posthog from "posthog-js";

export function initPostHog() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || typeof window === "undefined") return;

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false,
  });
}

export function trackOnboarding(
  event: "onboarding_step_viewed" | "onboarding_step_completed" | "onboarding_dropped",
  step: string,
  extra?: Record<string, string | boolean>
) {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.capture(event, { step, ...extra });
}

export function identifyUser(userId: string, traits?: Record<string, string>) {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.identify(userId, traits);
}
