import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getResumeOnboardingStep,
  type OnboardingProgress,
} from "@/lib/onboarding/navigation";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const explicitNext = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      let next = explicitNext ?? "/onboarding/profile";
      if (!explicitNext) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("users")
            .select(
              "onboarding_completed, first_name, last_name, role_type, payment_mix, income_band, phone_verified_at"
            )
            .eq("id", user.id)
            .maybeSingle();
          const progress = data as OnboardingProgress | null;
          next = progress?.onboarding_completed
            ? "/dashboard"
            : `/onboarding/${getResumeOnboardingStep(progress)}`;
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
