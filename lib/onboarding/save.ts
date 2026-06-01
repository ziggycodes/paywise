import { createClient } from "@/lib/supabase/client";

export async function saveOnboardingFields(
  fields: Record<string, unknown>
): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const update: Record<string, unknown> = {};
  if (fields.full_name) update.full_name = String(fields.full_name).trim();
  if (fields.email) {
    const { data: existing } = await supabase
      .from("users")
      .select("email")
      .eq("id", user.id)
      .maybeSingle();
    if (!existing?.email) {
      update.email = String(fields.email).trim();
    }
  }
  if (fields.role_type) update.role_type = fields.role_type;
  if (fields.payment_mix) {
    update.payment_mix =
      typeof fields.payment_mix === "string"
        ? fields.payment_mix
        : JSON.stringify(fields.payment_mix);
  }
  if (fields.income_band) update.income_band = fields.income_band;
  if (fields.has_cac !== undefined) update.has_cac = fields.has_cac === "yes";
  if (fields.rc_number) update.rc_number = fields.rc_number;
  if (fields.tin) update.tin = fields.tin;
  if (fields.is_vat_registered !== undefined) {
    update.is_vat_registered = fields.is_vat_registered === "yes";
  }

  const { error } = await supabase.from("users").update(update).eq("id", user.id);
  if (error) throw error;
}

export async function completeOnboarding(): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("users")
    .update({ onboarding_completed: true, account_status: "active" })
    .eq("id", user.id);
  if (error) throw error;
}
