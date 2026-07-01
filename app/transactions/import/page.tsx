import { StatementImport } from "@/components/transactions/statement-import";
import { SectionLabel } from "@/components/marketing/section-label";

export default function ImportStatementPage() {
  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      <header>
        <SectionLabel>Transactions</SectionLabel>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-pw-text">
          Import a statement
        </h1>
        <p className="mt-1 text-sm text-pw-text-secondary">
          Bring in history from your bank, Wise, Payoneer, or Deel.
        </p>
      </header>
      <StatementImport />
    </div>
  );
}
