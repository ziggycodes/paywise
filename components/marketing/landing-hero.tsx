import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductMockup } from "@/components/marketing/product-mockup";
import { SectionLabel } from "@/components/marketing/section-label";

const logos = ["Stutern", "DevConnect", "LensLight", "RetailOps"];

export function LandingHero() {
  return (
    <section className="px-4 pb-20 pt-14 sm:px-6 sm:pb-28 sm:pt-20">
      <div className="mx-auto max-w-6xl">
        {/* Notion-style centered hero */}
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>Financial copilot · Nigeria</SectionLabel>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-pw-border bg-pw-surface px-3 py-1 text-xs text-pw-text-secondary shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Nigeria Tax Act 2025 ready
          </div>

          <h1 className="mt-8 text-[2.5rem] font-semibold leading-[1.1] tracking-tight text-pw-text sm:text-5xl md:text-[3.5rem]">
            Give to Caesar!
            <br />
            <span className="text-pw-highlight">Keep your own.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-pw-text-secondary">
            PayWise tracks your hustle, estimates what you owe, and helps you
            keep the rest—without spreadsheet panic.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-md px-6">
              <Link href="/signup">
                Get started — it&apos;s free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-md">
              <a href="#features">See how it works</a>
            </Button>
          </div>
        </div>

        {/* Mobbin-style full-width product showcase */}
        <div className="mt-16 sm:mt-20">
          <ProductMockup />
        </div>

        {/* Social proof strip */}
        <div className="mt-14 border-t border-pw-border pt-10 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-pw-text-tertiary">
            Trusted by Nigerian creators & agencies
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {logos.map((name) => (
              <span
                key={name}
                className="text-sm font-medium text-pw-text-tertiary"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
