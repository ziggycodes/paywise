import { ArrowUpRight } from "lucide-react";

const transactions = [
  { name: "Bolt Nigeria", meta: "Transport · 98%", amount: "+₦4,200", dot: "bg-orange-400" },
  { name: "MTN Nigeria", meta: "Internet · 96%", amount: "+₦15,000", dot: "bg-pw-accent" },
  { name: "Client payment", meta: "Services · 99%", amount: "+₦320,000", dot: "bg-emerald-500" },
];

export function ProductMockup() {
  return (
    <div className="relative mx-auto w-full max-w-4xl">
      <div
        className="pointer-events-none absolute -inset-x-8 -top-8 h-48 rounded-full bg-pw-soft-blue/80 blur-3xl"
        aria-hidden
      />

      <div className="relative overflow-hidden rounded-2xl border border-pw-border bg-pw-surface shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)]">
        {/* Mobbin-style browser chrome */}
        <div className="flex items-center gap-3 border-b border-pw-border bg-pw-bg-subtle px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex flex-1 items-center justify-center">
            <span className="rounded-md border border-pw-border bg-pw-surface px-4 py-1 text-xs text-pw-text-tertiary">
              app.paywise.ng
            </span>
          </div>
          <ArrowUpRight className="h-4 w-4 text-pw-text-tertiary" />
        </div>

        <div className="grid gap-0 md:grid-cols-[220px_1fr]">
          {/* Sidebar — Notion-like narrow rail */}
          <aside className="hidden border-r border-pw-border bg-pw-bg-subtle p-4 md:block">
            <p className="text-xs font-semibold text-pw-text">PayWise</p>
            <p className="mt-1 text-[11px] text-pw-text-tertiary">Wise Egbon</p>
            <ul className="mt-6 space-y-1 text-[13px]">
              {["Dashboard", "Transactions", "Invoices", "Tax Assistant"].map(
                (item, i) => (
                  <li
                    key={item}
                    className={
                      i === 0
                        ? "rounded-md bg-pw-surface px-2 py-1.5 font-medium text-pw-text shadow-sm"
                        : "px-2 py-1.5 text-pw-text-secondary"
                    }
                  >
                    {item}
                  </li>
                )
              )}
            </ul>
          </aside>

          {/* Main dashboard */}
          <div className="p-5 sm:p-6">
            <p className="text-sm text-pw-text-secondary">Good morning, Boss</p>
            <p className="mt-0.5 text-xs text-pw-text-tertiary">
              Here&apos;s how your hustle is looking this month
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-pw-border bg-pw-soft-green p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-pw-text-secondary">
                  Income this month
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-pw-text sm:text-3xl">
                  ₦1,245,000
                </p>
                <p className="mt-1 text-xs text-emerald-700">+12% vs last month</p>
              </div>

              <div className="rounded-xl border border-pw-border bg-pw-soft-blue p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-pw-text-secondary">
                  Tax runway
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-pw-text">
                  ₦420k
                </p>
                <p className="mt-1 text-xs text-pw-accent">Due in 14 days</p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-pw-border bg-pw-bg-subtle p-3">
              <p className="mb-2 text-[11px] font-medium text-pw-text-secondary">
                Recent transactions
              </p>
              <ul className="space-y-2">
                {transactions.map((tx) => (
                  <li
                    key={tx.name}
                    className="flex items-center gap-3 rounded-lg bg-pw-surface px-3 py-2"
                  >
                    <span className={`h-2 w-2 shrink-0 rounded-full ${tx.dot}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-pw-text">
                        {tx.name}
                      </p>
                      <p className="text-[11px] text-pw-text-tertiary">{tx.meta}</p>
                    </div>
                    <span className="text-sm font-medium text-emerald-700">
                      {tx.amount}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
