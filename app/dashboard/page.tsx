import Link from "next/link";
import { HeroWidgets } from "@/components/dashboard/hero-widgets";
import { TransactionsRealtimeStub } from "@/components/dashboard/transactions-realtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionLabel } from "@/components/marketing/section-label";
import { createClient } from "@/lib/supabase/server";
import { dashboardGreeting, resolveFirstName } from "@/lib/user/display-name";
import {
  computeDashboardSummary,
  type SummaryRow,
} from "@/lib/dashboard/summary";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let firstName: string | null = null;
  let summaryRows: SummaryRow[] = [];
  if (user) {
    const [{ data: profile }, { data: txns }] = await Promise.all([
      supabase
        .from("users")
        .select("first_name, last_name, full_name")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("transactions")
        .select("amount_ngn, transaction_type, tax_relevant, date")
        .eq("user_id", user.id),
    ]);

    const meta = user.user_metadata as {
      first_name?: string;
      last_name?: string;
      full_name?: string;
      name?: string;
    };
    firstName = resolveFirstName({
      first_name: profile?.first_name ?? meta.first_name,
      last_name: profile?.last_name ?? meta.last_name,
      full_name: profile?.full_name ?? meta.full_name ?? meta.name,
    });
    summaryRows = (txns as SummaryRow[] | null) ?? [];
  }

  const summary = computeDashboardSummary(summaryRows);

  return (
    <div className="space-y-8 p-4 sm:p-6 md:p-8">
      <header>
        <SectionLabel>Dashboard</SectionLabel>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-pw-text sm:text-3xl">
          {dashboardGreeting(firstName)}
        </h1>
        <p className="mt-1 text-sm text-pw-text-secondary">
          Your money at a glance — full tax estimates arrive in Phase 3.
        </p>
      </header>

      <HeroWidgets summary={summary} />

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
