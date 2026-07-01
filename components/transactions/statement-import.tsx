"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createTransactions } from "@/lib/transactions/create";
import {
  detectMapping,
  mapRows,
  parseDelimited,
  parsedRowToInput,
  STATEMENT_PRESETS,
  type ColumnMapping,
  type ParsedRow,
} from "@/lib/transactions/csv";
import { SUPPORTED_CURRENCIES, type TransactionType } from "@/lib/transactions/types";
import { formatDate, formatMoney } from "@/lib/transactions/format";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const selectClass =
  "flex h-9 w-full rounded-md border border-pw-border-strong bg-pw-surface px-2 py-1 text-sm text-pw-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-accent focus-visible:ring-offset-2";

type Stage = "upload" | "map" | "review";

const FIELD_OPTIONS: { key: keyof ColumnMapping; label: string; allowNone?: boolean }[] = [
  { key: "date", label: "Date column" },
  { key: "description", label: "Description column" },
  { key: "amount", label: "Signed amount column", allowNone: true },
  { key: "debit", label: "Debit / money out column", allowNone: true },
  { key: "credit", label: "Credit / money in column", allowNone: true },
  { key: "currency", label: "Currency column", allowNone: true },
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

export function StatementImport() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [preset, setPreset] = useState(STATEMENT_PRESETS[0].id);
  const [defaultCurrency, setDefaultCurrency] = useState(
    STATEMENT_PRESETS[0].defaultCurrency
  );
  const [fileName, setFileName] = useState("");
  const [stage, setStage] = useState<Stage>("upload");

  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function reset() {
    setStage("upload");
    setHeaders([]);
    setDataRows([]);
    setMapping(null);
    setRows([]);
    setFileName("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setFileName(file.name);
    setBusy(true);

    try {
      if (file.name.toLowerCase().endsWith(".pdf")) {
        await handlePdf(file);
      } else {
        await handleCsv(file);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read the file.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCsv(file: File) {
    const text = await file.text();
    const grid = parseDelimited(text);
    if (grid.length < 2) {
      throw new Error("This file has no data rows we could read.");
    }
    const head = grid[0];
    setHeaders(head);
    setDataRows(grid.slice(1));
    setMapping(detectMapping(head));
    setStage("map");
  }

  async function handlePdf(file: File) {
    const base64 = await fileToBase64(file);
    const res = await fetch("/api/transactions/parse-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64, defaultCurrency }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error ?? "Could not parse the PDF.");
    }
    const extracted = (json.transactions ?? []) as {
      date: string | null;
      description: string;
      amount: number | null;
      type: TransactionType;
      currency: string;
    }[];
    if (extracted.length === 0) {
      throw new Error("No transactions were found in this PDF.");
    }
    setRows(
      extracted.map((t, i) => ({
        rowIndex: i,
        date: t.date,
        description: t.description,
        type: t.type,
        amount: t.amount,
        currency: t.currency || defaultCurrency,
        include: t.date !== null && t.amount !== null && t.amount > 0,
        raw: [],
      }))
    );
    setStage("review");
  }

  function buildPreview() {
    if (!mapping) return;
    if (mapping.date < 0 || (mapping.amount < 0 && mapping.debit < 0 && mapping.credit < 0)) {
      setError("Map at least a date column and an amount (or debit/credit) column.");
      return;
    }
    setError(null);
    setRows(mapRows(dataRows, mapping, defaultCurrency));
    setStage("review");
  }

  async function confirmImport() {
    setError(null);
    const prefix = fileName.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 40) || "import";
    const inputs = rows
      .map((r) => parsedRowToInput(r, "csv", prefix))
      .filter((i): i is NonNullable<typeof i> => i !== null)
      .map((i) => ({
        ...i,
        sourceMetadata: { ...i.sourceMetadata, preset },
      }));

    if (inputs.length === 0) {
      setError("Nothing selected to import.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { inserted } = await createTransactions(supabase, user.id, inputs);
      router.push(`/transactions?imported=${inserted}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
      setBusy(false);
    }
  }

  const includedCount = rows.filter((r) => r.include).length;

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Import a statement</CardTitle>
        <CardDescription>
          Upload a CSV/Excel export or a PDF bank statement. Review every row
          before anything is saved.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && (
          <p className="rounded-md bg-pw-error-bg p-3 text-sm text-pw-error-text">
            {error}
          </p>
        )}

        {stage === "upload" && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="preset">Source</Label>
                <select
                  id="preset"
                  className={selectClass}
                  value={preset}
                  onChange={(e) => {
                    setPreset(e.target.value);
                    const p = STATEMENT_PRESETS.find((x) => x.id === e.target.value);
                    if (p) setDefaultCurrency(p.defaultCurrency);
                  }}
                >
                  {STATEMENT_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="default-currency">Default currency</Label>
                <select
                  id="default-currency"
                  className={selectClass}
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-pw-border p-6 text-center">
              <p className="text-sm text-pw-text-secondary">
                CSV, TSV, or PDF. Excel users: export as CSV first.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt,.pdf"
                onChange={handleFile}
                disabled={busy}
                className="mt-3 block w-full cursor-pointer text-sm text-pw-text-secondary file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-pw-cta file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-pw-cta-hover"
              />
              {busy && (
                <p className="mt-3 text-xs text-pw-text-tertiary">
                  Reading {fileName}…
                </p>
              )}
            </div>
          </div>
        )}

        {stage === "map" && mapping && (
          <div className="space-y-4">
            <p className="text-sm text-pw-text-secondary">
              Confirm which columns map to which fields. Use a signed amount
              column, or separate debit/credit columns.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {FIELD_OPTIONS.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label htmlFor={`map-${field.key}`}>{field.label}</Label>
                  <select
                    id={`map-${field.key}`}
                    className={selectClass}
                    value={mapping[field.key]}
                    onChange={(e) =>
                      setMapping({
                        ...mapping,
                        [field.key]: Number(e.target.value),
                      })
                    }
                  >
                    <option value={-1}>— none —</option>
                    {headers.map((h, i) => (
                      <option key={i} value={i}>
                        {h || `Column ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button type="button" onClick={buildPreview}>
                Preview rows
              </Button>
              <Button type="button" variant="ghost" onClick={reset}>
                Start over
              </Button>
            </div>
          </div>
        )}

        {stage === "review" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-pw-text-secondary">
                {includedCount} of {rows.length} rows will be imported.
              </p>
              <button
                type="button"
                onClick={() =>
                  setRows((prev) =>
                    prev.map((r) => ({
                      ...r,
                      include: r.date !== null && r.amount !== null && r.amount > 0,
                    }))
                  )
                }
                className="text-xs text-pw-accent hover:underline"
              >
                Reset selection
              </button>
            </div>

            <div className="max-h-[26rem] overflow-auto rounded-xl border border-pw-border">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-pw-bg-subtle text-xs uppercase tracking-wide text-pw-text-tertiary">
                  <tr>
                    <th className="p-2"> </th>
                    <th className="p-2">Date</th>
                    <th className="p-2">Description</th>
                    <th className="p-2">Type</th>
                    <th className="p-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pw-border">
                  {rows.map((r) => {
                    const invalid = r.date === null || r.amount === null || r.amount <= 0;
                    return (
                      <tr
                        key={r.rowIndex}
                        className={invalid ? "opacity-50" : undefined}
                      >
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={r.include}
                            disabled={invalid}
                            onChange={(e) =>
                              setRows((prev) =>
                                prev.map((x) =>
                                  x.rowIndex === r.rowIndex
                                    ? { ...x, include: e.target.checked }
                                    : x
                                )
                              )
                            }
                          />
                        </td>
                        <td className="p-2 whitespace-nowrap">
                          {r.date ? formatDate(r.date) : "—"}
                        </td>
                        <td className="max-w-[16rem] truncate p-2">
                          {r.description || "—"}
                        </td>
                        <td className="p-2">
                          <select
                            className={selectClass}
                            value={r.type}
                            onChange={(e) =>
                              setRows((prev) =>
                                prev.map((x) =>
                                  x.rowIndex === r.rowIndex
                                    ? { ...x, type: e.target.value as TransactionType }
                                    : x
                                )
                              )
                            }
                          >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                          </select>
                        </td>
                        <td className="p-2 text-right whitespace-nowrap">
                          {r.amount !== null
                            ? formatMoney(r.amount, r.currency)
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={confirmImport}
                disabled={busy || includedCount === 0}
              >
                {busy ? "Importing…" : `Import ${includedCount} transactions`}
              </Button>
              <Button type="button" variant="ghost" onClick={reset} disabled={busy}>
                Start over
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
