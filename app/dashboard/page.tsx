import Link from "next/link";
import { HeroWidgets } from "@/components/dashboard/hero-widgets";
import { TransactionsRealtimeStub } from "@/components/dashboard/transactions-realtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionLabel } from "@/components/marketing/section-label";
import { createClient } from "@/lib/supabase/server";
import { dashboardGreeting, getFirstName } from "@/lib/user/display-name";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let firstName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const meta = user.user_metadata as { full_name?: string; name?: string };
    firstName = getFirstName(
      profile?.full_name ?? meta.full_name ?? meta.name ?? null
    );
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 md:p-8">
      <header>
        <SectionLabel>Dashboard</SectionLabel>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-pw-text sm:text-3xl">
          {dashboardGreeting(firstName)}
        </h1>
        <p className="mt-1 text-sm text-pw-text-secondary">
          Your money at a glance — estimates go live in Phase 3.
        </p>
      </header>

      <HeroWidgets />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionsRealtimeStub />
        </CardContent>
      </Card>

      <p className="text-xs text-pw-text-tertiary">
        Tax estimates are illustrative only — not filing advice. See{" "}
        <Link href="/privacy" className="text-pw-accent hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
