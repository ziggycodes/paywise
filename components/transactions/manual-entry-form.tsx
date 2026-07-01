"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createTransaction } from "@/lib/transactions/create";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  SUPPORTED_CURRENCIES,
  type TransactionType,
} from "@/lib/transactions/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const selectClass =
  "flex h-10 w-full rounded-md border border-pw-border-strong bg-pw-surface px-3 py-2 text-sm text-pw-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-accent focus-visible:ring-offset-2";

type Props = {
  defaultType?: TransactionType;
  initial?: Partial<{
    amount: string;
    currency: string;
    merchant: string;
    date: string;
    category: string;
    notes: string;
  }>;
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ManualEntryForm({ defaultType = "expense", initial }: Props) {
  const router = useRouter();
  const [type, setType] = useState<TransactionType>(defaultType);
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [currency, setCurrency] = useState(initial?.currency ?? "NGN");
  const [merchant, setMerchant] = useState(initial?.merchant ?? "");
  const [date, setDate] = useState(initial?.date ?? today());
  const [category, setCategory] = useState(initial?.category ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(
    () => (type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES),
    [type]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (!date) {
      setError("Pick a date.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      await createTransaction(supabase, user.id, {
        type,
        amount: amountNum,
        currency,
        date,
        merchant: merchant.trim() || null,
        category: category || null,
        notes: notes.trim() || null,
        source: "manual",
      });

      router.push("/transactions");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save transaction.");
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Add a transaction</CardTitle>
        <CardDescription>
          Record income or an expense. We convert to NGN and suggest a category.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-md bg-pw-error-bg p-3 text-sm text-pw-error-text">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setType("expense");
                setCategory("");
              }}
              className={`cursor-pointer rounded-md border px-3 py-2 text-sm transition-colors ${
                type === "expense"
                  ? "border-pw-highlight bg-pw-highlight-soft text-pw-text"
                  : "border-pw-border text-pw-text-secondary hover:bg-pw-bg-subtle"
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => {
                setType("income");
                setCategory("");
              }}
              className={`cursor-pointer rounded-md border px-3 py-2 text-sm transition-colors ${
                type === "income"
                  ? "border-pw-highlight bg-pw-highlight-soft text-pw-text"
                  : "border-pw-border text-pw-text-secondary hover:bg-pw-bg-subtle"
              }`}
            >
              Income
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                className={selectClass}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="merchant">
              {type === "income" ? "Payer / source" : "Merchant / description"}
            </Label>
            <Input
              id="merchant"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder={type === "income" ? "ABC Ltd" : "Bolt, Adobe, diesel…"}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                max={today()}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className={selectClass}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Auto-detect</option>
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything worth remembering"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save transaction"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/transactions")}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
