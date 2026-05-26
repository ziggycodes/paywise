import Link from "next/link";
import { AppPage } from "@/components/layout/app-page";
import { SectionLabel } from "@/components/marketing/section-label";

export default function TermsPage() {
  return (
    <AppPage narrow showHeader>
      <article className="space-y-6">
        <div>
          <SectionLabel>Legal</SectionLabel>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-pw-text">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-pw-text-tertiary">
            Placeholder — lawyer review required (§9).
          </p>
        </div>

        <div className="rounded-2xl border border-pw-border bg-pw-surface p-6 text-sm leading-relaxed text-pw-text-secondary">
          <p>
            PayWise provides tax estimates, not legal or filing advice. You are
            responsible for filings with the Nigeria Revenue Service (NRS).
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex text-sm font-medium text-pw-accent hover:underline"
        >
          ← Back to home
        </Link>
      </article>
    </AppPage>
  );
}
