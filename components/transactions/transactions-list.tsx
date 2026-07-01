"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { categoryLabel, type TransactionRow } from "@/lib/transactions/types";
import { formatDate, formatMoney, formatNgn } from "@/lib/transactions/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SELECT_COLUMNS =
  "id, account_id, amount, currency, amount_ngn, merchant_raw, merchant_normalized, category, category_confidence, ai_categorized, user_corrected, date, transaction_type, source, tax_relevant, notes, created_at";

const selectClass =
  "flex h-9 rounded-md border border-pw-border-strong bg-pw-surface px-3 py-1.5 text-sm text-pw-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-accent focus-visible:ring-offset-2";

type Filter = "all" | "income" | "expense";

const SOURCE_LABELS: Record<string, string> = {
  manual: "Manual",
  mono: "Bank",
  csv: "Import",
  receipt: "Receipt",
  sms: "SMS",
  whatsapp: "WhatsApp",
};

export function TransactionsList() {
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from("transactions")
        .select(SELECT_COLUMNS)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(200);
      setRows((data as TransactionRow[] | null) ?? []);
      setLoading(false);
    }
    void load();

    const channel = supabase
      .channel("transactions-list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => void load()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && r.transaction_type !== filter) return false;
      if (!q) return true;
      return (
        (r.merchant_raw ?? "").toLowerCase().includes(q) ||
        categoryLabel(r.category).toLowerCase().includes(q)
      );
    });
  }, [rows, filter, search]);

  if (loading) {
    return (
      <p className="py-12 text-center text-sm text-pw-text-secondary">
        Loading transactions…
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-pw-border p-10 text-center">
        <p className="text-sm text-pw-text-secondary">
          No transactions yet. Add one manually, import a statement, or connect
          your bank.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button asChild size="sm">
            <Link href="/transactions/new">Add transaction</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/transactions/import">Import statement</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/transactions/connect">Connect bank</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          className={selectClass}
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
        >
          <option value="all">All</option>
          <option value="income">Income</option>
          <option value="expense">Expenses</option>
        </select>
        <Input
          className="h-9 max-w-xs"
          placeholder="Search merchant or category"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="ml-auto text-xs text-pw-text-tertiary">
          {filtered.length} of {rows.length}
        </span>
      </div>

      <ul className="divide-y divide-pw-border overflow-hidden rounded-2xl border border-pw-border">
        {filtered.map((t) => {
          const isIncome = t.transaction_type === "income";
          return (
            <li
              key={t.id}
              className="flex items-center justify-between gap-3 bg-pw-surface px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-pw-text">
                  {t.merchant_raw ?? (isIncome ? "Income" : "Expense")}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-pw-text-tertiary">
                  <span>{formatDate(t.date)}</span>
                  <span aria-hidden>·</span>
                  <span>{categoryLabel(t.category)}</span>
                  <span aria-hidden>·</span>
                  <span>{SOURCE_LABELS[t.source] ?? t.source}</span>
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={`text-sm font-semibold ${
                    isIncome ? "text-pw-highlight" : "text-pw-text"
                  }`}
                >
                  {isIncome ? "+" : "−"}
                  {formatMoney(t.amount, t.currency)}
                </p>
                {t.currency !== "NGN" && (
                  <p className="text-xs text-pw-text-tertiary">
                    {formatNgn(t.amount_ngn)}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
