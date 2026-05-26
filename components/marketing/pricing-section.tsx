import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SectionLabel } from "@/components/marketing/section-label";

const tiers = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "Get clarity on your money without paying a kobo.",
    features: [
      "1 bank connection",
      "Up to 50 transactions/month",
      "Manual entry + 5 AI categorizations/day",
      "Basic tax estimate",
    ],
    cta: "Get started",
    href: "/signup",
    featured: false,
  },
  {
    name: "Pro",
    price: "₦4,500",
    period: "/month",
    altPrice: "₦45,000/year — save ~17%",
    description: "The full copilot for serious freelancers.",
    features: [
      "Unlimited transactions & AI categorization",
      "WhatsApp assistant",
      "Invoice generator with WHT/VAT",
      "Multi-currency + WHT tracking",
    ],
    cta: "Get started",
    href: "/signup",
    featured: true,
    badge: "Popular",
  },
  {
    name: "Agency",
    price: "Custom",
    period: "",
    description: "For consultancies managing multiple books.",
    features: [
      "Everything in Pro",
      "Multi-business support",
      "Accountant export packs (PDF + CSV)",
      "Priority onboarding",
    ],
    cta: "Contact us",
    href: "/signup",
    featured: false,
  },
];

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="scroll-mt-16 px-4 py-20 sm:px-6"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>Pricing</SectionLabel>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-pw-text sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-pw-text-secondary">
            Naira-first. About the cost of Showmax for Pro—no sales call needed.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {tiers.map((tier) => (
            <article
              key={tier.name}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-pw-surface p-6",
                tier.featured
                  ? "border-pw-text shadow-[0_8px_30px_rgba(0,0,0,0.08)] ring-1 ring-pw-text"
                  : "border-pw-border"
              )}
            >
              {tier.badge && (
                <span className="absolute -top-3 left-6 rounded-md bg-pw-highlight px-2 py-0.5 text-xs font-semibold text-white">
                  {tier.badge}
                </span>
              )}

              <h3 className="text-base font-semibold text-pw-text">{tier.name}</h3>

              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-semibold text-pw-text">
                  {tier.price}
                </span>
                {tier.period && (
                  <span className="text-sm text-pw-text-secondary">
                    {tier.period}
                  </span>
                )}
              </div>

              {"altPrice" in tier && tier.altPrice && (
                <p className="mt-1 text-xs text-pw-text-tertiary">
                  {tier.altPrice}
                </p>
              )}

              <p className="mt-3 text-sm text-pw-text-secondary">
                {tier.description}
              </p>

              <ul className="mt-6 flex-1 space-y-3 border-t border-pw-border pt-6">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-2.5 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-pw-accent" />
                    <span className="text-pw-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                variant={tier.featured ? "default" : "outline"}
                className={cn(
                  "mt-8 w-full rounded-md",
                  !tier.featured && "border-pw-border-strong"
                )}
              >
                <Link href={tier.href}>{tier.cta}</Link>
              </Button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
