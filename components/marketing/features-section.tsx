import type { ReactNode } from "react";
import {
  MessageCircle,
  Sparkles,
  Receipt,
  Smartphone,
  FileText,
  Globe,
} from "lucide-react";
import { SectionLabel } from "@/components/marketing/section-label";

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="scroll-mt-16 border-t border-pw-border bg-pw-bg-subtle px-4 py-20 sm:px-6"
    >
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <SectionLabel>How PayWise handles your tax</SectionLabel>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-pw-text sm:text-4xl">
            From messy income to a clear tax number.
          </h2>
          <p className="mt-4 text-lg text-pw-text-secondary">
            PayWise auto-categorizes your income and expenses, estimates what you
            owe under NTA 2025 in real time, and surfaces filing deadlines—so tax
            stops being a guessing game.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-6 md:grid-rows-2">
          <BentoCard
            className="order-3 md:order-1 md:col-span-4 md:row-span-2"
            icon={<Sparkles className="h-5 w-5 text-pw-accent" />}
            title="Smart categorization"
            description="So your tax estimate is built on clean books. Bolt, MTN, Chowdeck, Wise—recognized natively without you tagging every line."
            tint="bg-pw-soft-blue"
          >
            <div className="mt-5 space-y-2">
              {[
                { label: "Bolt Nigeria", tag: "Transport", pct: "98%" },
                { label: "Payoneer", tag: "Foreign income", pct: "94%" },
                { label: "Cash — client", tag: "Services", pct: "91%" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-lg border border-pw-border bg-pw-surface px-3 py-2.5"
                >
                  <span className="text-sm font-medium text-pw-text">
                    {row.label}
                  </span>
                  <span className="text-xs text-pw-text-secondary">
                    {row.tag} · {row.pct}
                  </span>
                </div>
              ))}
            </div>
          </BentoCard>

          <BentoCard
            className="order-2 md:order-2 md:col-span-2"
            icon={<MessageCircle className="h-5 w-5 text-emerald-600" />}
            title="WhatsApp copilot"
            description="Tax answers and reminders where you already chat—no new app habit."
            tint="bg-pw-soft-green"
          >
            <div className="mt-4 space-y-2">
              <div className="max-w-[90%] rounded-xl rounded-tl-sm border border-pw-border bg-pw-surface px-3 py-2 text-xs text-pw-text">
                Boss, tax due ₦420k by 31 March.
              </div>
              <div className="ml-auto max-w-[80%] rounded-xl rounded-tr-sm bg-pw-cta px-3 py-2 text-xs text-white">
                Wetin be my WHT?
              </div>
            </div>
          </BentoCard>

          <BentoCard
            className="order-1 md:order-3 md:col-span-2"
            icon={<Receipt className="h-5 w-5 text-pw-highlight" />}
            title="Real-time tax estimation"
            description="NTA 2025 built in—not a generic calculator. See what you owe as your money moves."
            tint="bg-pw-highlight-soft"
          >
            <p className="mt-3 text-2xl font-semibold text-pw-text">₦450,000</p>
            <p className="text-xs font-medium text-pw-text-secondary">
              Estimated tax (YTD)
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-pw-border">
              <div className="h-full w-[68%] rounded-full bg-pw-highlight" />
            </div>
            <p className="mt-2 text-xs text-pw-text-secondary">
              Runway to ₦800k threshold
            </p>
          </BentoCard>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <MiniFeature
            icon={<Globe className="h-4 w-4" />}
            title="NGN + USD"
            text="Multi-currency income flows into one tax picture."
          />
          <MiniFeature
            icon={<FileText className="h-4 w-4" />}
            title="Invoices"
            text="WHT and VAT lines ready for filing prep."
          />
          <MiniFeature
            icon={<Smartphone className="h-4 w-4" />}
            title="SMS + bank sync"
            text="Every inflow and expense counted toward your estimate."
          />
        </div>
      </div>
    </section>
  );
}

function BentoCard({
  className = "",
  icon,
  title,
  description,
  tint,
  children,
}: {
  className?: string;
  icon: ReactNode;
  title: string;
  description: string;
  tint: string;
  children: ReactNode;
}) {
  return (
    <article
      className={`rounded-2xl border border-pw-border bg-pw-surface p-6 shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      <div className={`inline-flex rounded-lg p-2.5 ${tint}`}>{icon}</div>
      <h3 className="mt-4 text-lg font-semibold text-pw-text">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-pw-text-secondary">
        {description}
      </p>
      {children}
    </article>
  );
}

function MiniFeature({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-pw-border bg-pw-surface p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-pw-bg-subtle text-pw-text-secondary">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-pw-text">{title}</p>
        <p className="mt-0.5 text-sm text-pw-text-secondary">{text}</p>
      </div>
    </div>
  );
}
