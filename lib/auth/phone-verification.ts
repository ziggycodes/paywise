import { createClient } from "@/lib/supabase/client";

export async function sendPhoneVerificationOtp(e164: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ phone: e164 });
  if (error) throw error;
}

export async function verifyPhoneVerificationOtp(
  e164: string,
  token: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({
    phone: e164,
    token,
    type: "phone_change",
  });
  if (error) throw error;
}
