import Link from "next/link";
import { AppPage } from "@/components/layout/app-page";
import { SectionLabel } from "@/components/marketing/section-label";

export default function PrivacyPage() {
  return (
    <AppPage narrow showHeader>
      <article className="space-y-6">
        <div>
          <SectionLabel>Legal</SectionLabel>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-pw-text">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-pw-text-tertiary">
            Placeholder — legal review required before launch (§9).
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border border-pw-border bg-pw-surface p-6 text-sm leading-relaxed text-pw-text-secondary">
          <p>
            PayWise processes your financial data to provide estimates and
            insights. We do not share raw BVN/NIN with third parties; identity
            checks use hashed values only.
          </p>
          <p>
            We are registering with the Nigeria Data Protection Commission
            (NDPC). A full policy in English and Pidgin will ship before public
            launch.
          </p>
          <p>Contact: privacy@paywise.ng (update before launch).</p>
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
