import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getResumeOnboardingStep } from "@/lib/onboarding/navigation";

const ONBOARDING_PROGRESS_COLUMNS =
  "onboarding_completed, first_name, last_name, role_type, payment_mix, income_band, phone_verified_at";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  // Email confirmation gates app access: a session alone is not enough.
  const isEmailVerified = !!user && !!user.email_confirmed_at;
  const isAuthRoute =
    path.startsWith("/login") ||
    path.startsWith("/signup") ||
    path.startsWith("/auth");
  // API routes authenticate themselves (session check or webhook secret) and
  // must never receive an HTML redirect to /login — that would break
  // server-to-server callers like the Mono webhook.
  const isApiRoute = path.startsWith("/api");
  const isPublicRoute =
    isAuthRoute ||
    isApiRoute ||
    path === "/" ||
    path.startsWith("/privacy") ||
    path.startsWith("/terms");

  // Unauthenticated or unverified-email users cannot enter protected areas
  // (onboarding, dashboard). Unverified sessions are sent back to signup to
  // finish email verification, keeping that flow separate from onboarding.
  if (!isEmailVerified && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = user ? "/signup" : "/login";
    return NextResponse.redirect(url);
  }

  const isAuthCallback =
    path === "/auth/callback" || path.startsWith("/auth/callback/");

  // Only verified users are bounced off auth routes into the app. Unverified
  // sessions stay on /signup so they can complete the email OTP step.
  const isProtectedAppRoute =
    path.startsWith("/dashboard") || path.startsWith("/transactions");

  if (isEmailVerified && isAuthRoute && !isAuthCallback) {
    const { data: profile } = await supabase
      .from("users")
      .select(ONBOARDING_PROGRESS_COLUMNS)
      .eq("id", user.id)
      .single();

    const url = request.nextUrl.clone();
    url.pathname = !profile?.onboarding_completed
      ? `/onboarding/${getResumeOnboardingStep(profile)}`
      : "/dashboard";
    return NextResponse.redirect(url);
  }

  if (isEmailVerified && isProtectedAppRoute) {
    const { data: profile } = await supabase
      .from("users")
      .select(ONBOARDING_PROGRESS_COLUMNS)
      .eq("id", user.id)
      .single();

    if (!profile?.onboarding_completed) {
      const url = request.nextUrl.clone();
      url.pathname = `/onboarding/${getResumeOnboardingStep(profile)}`;
      return NextResponse.redirect(url);
    }
  }

  if (isEmailVerified && path.startsWith("/onboarding")) {
    const { data: profile } = await supabase
      .from("users")
      .select(ONBOARDING_PROGRESS_COLUMNS)
      .eq("id", user.id)
      .single();

    if (profile?.onboarding_completed) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
