import Link from "next/link";
import { TransactionsList } from "@/components/transactions/transactions-list";
import { SectionLabel } from "@/components/marketing/section-label";
import { Button } from "@/components/ui/button";

export default function TransactionsPage() {
  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <SectionLabel>Transactions</SectionLabel>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-pw-text sm:text-3xl">
            Your transactions
          </h1>
          <p className="mt-1 text-sm text-pw-text-secondary">
            Everything PayWise has captured — manual, imported, or synced.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/transactions/new">Add transaction</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/transactions/import">Import statement</Link>
          </Button>
        </div>
      </header>

      <TransactionsList />
    </div>
  );
}
