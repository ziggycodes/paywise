import { ReceiptUpload } from "@/components/transactions/receipt-upload";
import { SectionLabel } from "@/components/marketing/section-label";

export default function ScanReceiptPage() {
  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      <header>
        <SectionLabel>Transactions</SectionLabel>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-pw-text">
          Scan a receipt
        </h1>
        <p className="mt-1 text-sm text-pw-text-secondary">
          Turn a photo into a categorized expense.
        </p>
      </header>
      <ReceiptUpload />
    </div>
  );
}
