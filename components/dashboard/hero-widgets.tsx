import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatNgn } from "@/lib/transactions/format";
import {
  daysUntil,
  nextFilingDeadline,
  TAX_FREE_THRESHOLD_NGN,
  type DashboardSummary,
} from "@/lib/dashboard/summary";

type WidgetProps = {
  title: string;
  description: string;
  value: string;
  valueClassName?: string;
  cta?: { label: string; href: string };
};

function HeroWidget({ title, description, value, valueClassName, cta }: WidgetProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-pw-text-secondary">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p
          className={
            valueClassName ??
            "text-2xl font-semibold tracking-tight text-pw-text"
          }
        >
          {value}
        </p>
        {cta && (
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function HeroWidgets({ summary }: { summary: DashboardSummary }) {
  const deadline = nextFilingDeadline();
  const days = daysUntil(deadline);
  const deadlineYear = deadline.getUTCFullYear();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <HeroWidget
        title="Income this month"
        description="NGN-normalized across currencies"
        value={summary.hasData ? formatNgn(summary.incomeThisMonthNgn) : "—"}
        cta={{ label: "Connect bank", href: "/transactions/connect" }}
      />
      <HeroWidget
        title="Deductible expenses"
        description="Tax-relevant, this year"
        value={
          summary.hasData ? formatNgn(summary.deductibleExpensesYtdNgn) : "—"
        }
        cta={{ label: "Add expense", href: "/transactions/new?type=expense" }}
      />
      <HeroWidget
        title="Estimated tax (YTD)"
        description="Nigeria Tax Act 2025 — full engine in Phase 3"
        value={
          summary.hasData && summary.crossedThreshold
            ? "Above ₦800k"
            : summary.hasData
              ? "₦0"
              : "—"
        }
      />
      <HeroWidget
        title="Tax-free runway"
        description={`Left before the ₦${(TAX_FREE_THRESHOLD_NGN / 1000).toFixed(
          0
        )}k threshold`}
        value={
          summary.hasData ? formatNgn(summary.taxFreeRunwayNgn) : "₦800k room"
        }
        valueClassName="text-2xl font-semibold tracking-tight text-pw-highlight"
      />
      <HeroWidget
        title="Next deadline"
        description={`31 March ${deadlineYear} filing`}
        value={`${days} days`}
      />
    </div>
  );
}
