import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client for trusted server contexts that have no user session —
 * e.g. provider webhooks. Bypasses RLS, so callers MUST scope every query to a
 * specific user_id themselves. Never import this into client components.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL are required for admin operations."
    );
  }
  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
