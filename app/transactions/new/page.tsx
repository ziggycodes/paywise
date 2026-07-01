import { ManualEntryForm } from "@/components/transactions/manual-entry-form";
import { SectionLabel } from "@/components/marketing/section-label";

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const defaultType = type === "income" ? "income" : "expense";

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      <header>
        <SectionLabel>Transactions</SectionLabel>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-pw-text">
          New transaction
        </h1>
      </header>
      <ManualEntryForm defaultType={defaultType} />
    </div>
  );
}
