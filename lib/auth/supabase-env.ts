/** True when the app points at local Supabase (CLI / Docker). */
export function isLocalSupabase(url?: string): boolean {
  const u = url ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return u.includes("127.0.0.1") || u.includes("localhost:54321");
}

export function signupSuccessMessage(): string {
  if (isLocalSupabase()) {
    return "Account created. Open http://localhost:54324 (Inbucket) to find your email OTP code.";
  }
  return "Check your email for the OTP code.";
}
