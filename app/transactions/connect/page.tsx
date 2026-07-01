import { ConnectBank } from "@/components/transactions/connect-bank";
import { SectionLabel } from "@/components/marketing/section-label";

export default function ConnectBankPage() {
  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      <header>
        <SectionLabel>Transactions</SectionLabel>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-pw-text">
          Connect a bank
        </h1>
        <p className="mt-1 text-sm text-pw-text-secondary">
          Automatic transaction sync via Mono open banking.
        </p>
      </header>
      <ConnectBank />
    </div>
  );
}
