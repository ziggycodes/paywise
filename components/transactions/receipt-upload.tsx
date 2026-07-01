"use client";

import { useState } from "react";
import { ManualEntryForm } from "@/components/transactions/manual-entry-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EXPENSE_CATEGORIES } from "@/lib/transactions/types";

type ScannedReceipt = {
  merchant: string | null;
  amount: number | null;
  currency: string;
  date: string | null;
  category: string | null;
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.readAsDataURL(file);
  });
}

export function ReceiptUpload() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanned, setScanned] = useState<ScannedReceipt | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setScanned(null);
    setBusy(true);

    try {
      const dataUrl = await fileToDataUrl(file);
      setPreview(dataUrl);
      const res = await fetch("/api/transactions/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64: dataUrl, mediaType: file.type }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not scan the receipt.");
      setScanned(json.receipt as ScannedReceipt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not scan the receipt.");
    } finally {
      setBusy(false);
    }
  }

  if (scanned) {
    const validCategory = EXPENSE_CATEGORIES.some(
      (c) => c.value === scanned.category
    );
    return (
      <div className="space-y-4">
        <p className="text-sm text-pw-text-secondary">
          Review the scanned details, adjust anything, then save.
        </p>
        <ManualEntryForm
          defaultType="expense"
          initial={{
            amount: scanned.amount != null ? String(scanned.amount) : "",
            currency: scanned.currency || "NGN",
            merchant: scanned.merchant ?? "",
            date: scanned.date ?? undefined,
            category: validCategory ? (scanned.category ?? "") : "",
          }}
        />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Scan a receipt</CardTitle>
        <CardDescription>
          Snap or upload a receipt photo. We read the merchant, amount, and date
          so you only confirm.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="rounded-md bg-pw-error-bg p-3 text-sm text-pw-error-text">
            {error}
          </p>
        )}

        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          disabled={busy}
          className="block w-full cursor-pointer text-sm text-pw-text-secondary file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-pw-cta file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-pw-cta-hover"
        />

        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Receipt preview"
            className="max-h-64 rounded-lg border border-pw-border object-contain"
          />
        )}

        {busy && (
          <p className="text-sm text-pw-text-tertiary">Reading your receipt…</p>
        )}

        <p className="text-xs text-pw-text-tertiary">
          You can also{" "}
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-auto px-1 py-0 align-baseline"
          >
            <a href="/transactions/new">enter it manually</a>
          </Button>
          .
        </p>
      </CardContent>
    </Card>
  );
}
