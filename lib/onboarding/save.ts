import { createClient } from "@/lib/supabase/client";
import { resolveFullName, splitFullName } from "@/lib/user/display-name";

export async function saveOnboardingFields(
  fields: Record<string, unknown>
): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const update: Record<string, unknown> = {};
  if (fields.first_name) update.first_name = String(fields.first_name).trim();
  if (fields.last_name) update.last_name = String(fields.last_name).trim();
  if (fields.full_name) {
    const fullName = String(fields.full_name).trim();
    update.full_name = fullName;
    if (fields.first_name === undefined && fields.last_name === undefined) {
      const { first_name, last_name } = splitFullName(fullName);
      update.first_name = first_name;
      update.last_name = last_name;
    }
  } else if (fields.first_name !== undefined || fields.last_name !== undefined) {
    update.full_name = resolveFullName({
      first_name: update.first_name as string | null,
      last_name: update.last_name as string | null,
    });
  }
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

  // Phone verification is a hard requirement for finishing onboarding — never
  // let a profile reach a completed state without a verified number.
  const { data: profile } = await supabase
    .from("users")
    .select("phone_verified_at")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.phone_verified_at) {
    throw new Error("Verify your phone number before finishing onboarding.");
  }

  const { error } = await supabase
    .from("users")
    .update({ onboarding_completed: true, account_status: "active" })
    .eq("id", user.id);
  if (error) throw error;
}
