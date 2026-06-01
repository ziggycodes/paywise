import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type WidgetProps = {
  title: string;
  description: string;
  emptyValue: string;
  cta?: { label: string; href: string };
};

function HeroWidget({ title, description, emptyValue, cta }: WidgetProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-pw-text-secondary">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight text-pw-text">
          {emptyValue}
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

export function HeroWidgets() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <HeroWidget
        title="Income this month"
        description="NGN-normalized, FX breakdown on hover (Phase 3)"
        emptyValue="—"
        cta={{ label: "Connect bank", href: "/onboarding/complete" }}
      />
      <HeroWidget
        title="Deductible expenses"
        description="Captured this month"
        emptyValue="—"
        cta={{ label: "Add expense", href: "/onboarding/complete" }}
      />
      <HeroWidget
        title="Estimated tax (YTD)"
        description="Nigeria Tax Act 2025 — Phase 3"
        emptyValue="—"
      />
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-pw-text-secondary">
            Tax-free runway
          </CardTitle>
          <CardDescription>Amount left before ₦800k threshold</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tracking-tight text-pw-highlight">
            ₦800k room
          </p>
        </CardContent>
      </Card>
      <HeroWidget
        title="Next deadline"
        description="31 March filing countdown"
        emptyValue="—"
      />
    </div>
  );
}
