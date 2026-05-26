"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type TxnRow = {
  id: string;
  merchant_raw: string | null;
  amount: number;
  currency: string;
  date: string;
};

export function TransactionsRealtimeStub() {
  const [transactions, setTransactions] = useState<TxnRow[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("transactions")
        .select("id, merchant_raw, amount, currency, date")
        .order("date", { ascending: false })
        .limit(5);
      if (data) setTransactions(data as TxnRow[]);
    }
    void load();

    const channel = supabase
      .channel("transactions-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => {
          void load();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  if (transactions.length === 0) {
    return (
      <p className="text-sm text-pw-text-secondary">
        No transactions yet. Connect your bank or add one manually (Phase 2).
      </p>
    );
  }

  return (
    <ul className="space-y-2 text-sm">
      {transactions.map((t) => (
        <li
          key={t.id}
          className="flex justify-between border-b border-pw-border py-2 last:border-0"
        >
          <span className="text-pw-text">{t.merchant_raw ?? "Transaction"}</span>
          <span className="font-medium text-pw-text">
            {t.currency} {Number(t.amount).toLocaleString()}
          </span>
        </li>
      ))}
    </ul>
  );
}
