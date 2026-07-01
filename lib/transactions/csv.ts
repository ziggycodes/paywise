import type { TransactionInput, TransactionType } from "./types";

/** RFC-4180-ish parser: handles quoted fields, escaped quotes, and \r\n. */
export function parseDelimited(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === "," || char === "\t" || char === ";") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char === "\r") {
      // ignore; handled by \n
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export type ColumnMapping = {
  date: number;
  description: number;
  /** Signed amount column, or -1 when using separate debit/credit columns. */
  amount: number;
  debit: number;
  credit: number;
  currency: number;
};

export type StatementPreset = {
  id: string;
  label: string;
  defaultCurrency: string;
};

export const STATEMENT_PRESETS: StatementPreset[] = [
  { id: "generic", label: "Generic bank statement", defaultCurrency: "NGN" },
  { id: "wise", label: "Wise", defaultCurrency: "USD" },
  { id: "payoneer", label: "Payoneer", defaultCurrency: "USD" },
  { id: "deel", label: "Deel", defaultCurrency: "USD" },
];

const DATE_HINTS = ["date", "posted", "transaction date", "value date", "time"];
const DESC_HINTS = [
  "description",
  "narration",
  "details",
  "merchant",
  "reference",
  "payee",
  "remark",
  "memo",
];
const AMOUNT_HINTS = ["amount", "value", "ngn", "usd", "total"];
const DEBIT_HINTS = ["debit", "withdrawal", "money out", "paid out", "dr"];
const CREDIT_HINTS = ["credit", "deposit", "money in", "paid in", "cr"];
const CURRENCY_HINTS = ["currency", "ccy"];

function findColumn(headers: string[], hints: string[]): number {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const hint of hints) {
    const exact = lower.indexOf(hint);
    if (exact >= 0) return exact;
  }
  for (let i = 0; i < lower.length; i++) {
    if (hints.some((hint) => lower[i].includes(hint))) return i;
  }
  return -1;
}

/** Best-effort auto-detection of a statement's column layout from its header. */
export function detectMapping(headers: string[]): ColumnMapping {
  const debit = findColumn(headers, DEBIT_HINTS);
  const credit = findColumn(headers, CREDIT_HINTS);
  const amount =
    debit >= 0 && credit >= 0 ? -1 : findColumn(headers, AMOUNT_HINTS);
  return {
    date: findColumn(headers, DATE_HINTS),
    description: findColumn(headers, DESC_HINTS),
    amount,
    debit,
    credit,
    currency: findColumn(headers, CURRENCY_HINTS),
  };
}

const MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

/** Parse a range of common statement date formats into YYYY-MM-DD. */
export function parseDate(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  // ISO or YYYY/MM/DD
  const iso = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) {
    return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  }

  // DD-MMM-YYYY (e.g. 03-Jan-2026)
  const named = value.match(/^(\d{1,2})[-\s/]([A-Za-z]{3})[a-z]*[-\s/](\d{2,4})/);
  if (named) {
    const mon = MONTHS[named[2].toLowerCase()];
    if (mon) {
      const year = named[3].length === 2 ? `20${named[3]}` : named[3];
      return `${year}-${mon}-${named[1].padStart(2, "0")}`;
    }
  }

  // DD/MM/YYYY (assume day-first, common for Nigerian/UK statements)
  const dmy = value.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (dmy) {
    const day = dmy[1].padStart(2, "0");
    const month = dmy[2].padStart(2, "0");
    const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return null;
}

/** Strip currency symbols, thousands separators, and parentheses-negatives. */
export function parseAmount(raw: string): number | null {
  if (!raw) return null;
  let value = raw.trim();
  let negative = false;
  if (/^\(.*\)$/.test(value)) {
    negative = true;
    value = value.slice(1, -1);
  }
  if (value.includes("-")) negative = true;
  const cleaned = value.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  if (!Number.isFinite(num)) return null;
  return negative ? -num : num;
}

export type ParsedRow = {
  rowIndex: number;
  date: string | null;
  description: string;
  type: TransactionType;
  amount: number | null;
  currency: string;
  include: boolean;
  raw: string[];
};

/** Turn parsed CSV data + a column mapping into editable, previewable rows. */
export function mapRows(
  dataRows: string[][],
  mapping: ColumnMapping,
  defaultCurrency: string
): ParsedRow[] {
  return dataRows.map((cells, rowIndex) => {
    const date = mapping.date >= 0 ? parseDate(cells[mapping.date] ?? "") : null;
    const description =
      mapping.description >= 0 ? (cells[mapping.description] ?? "").trim() : "";
    const currency =
      mapping.currency >= 0 && cells[mapping.currency]?.trim()
        ? cells[mapping.currency].trim().toUpperCase()
        : defaultCurrency;

    let type: TransactionType = "expense";
    let amount: number | null = null;

    if (mapping.amount >= 0) {
      const signed = parseAmount(cells[mapping.amount] ?? "");
      if (signed !== null) {
        type = signed >= 0 ? "income" : "expense";
        amount = Math.abs(signed);
      }
    } else {
      const debit =
        mapping.debit >= 0 ? parseAmount(cells[mapping.debit] ?? "") : null;
      const credit =
        mapping.credit >= 0 ? parseAmount(cells[mapping.credit] ?? "") : null;
      if (credit && credit !== 0) {
        type = "income";
        amount = Math.abs(credit);
      } else if (debit && debit !== 0) {
        type = "expense";
        amount = Math.abs(debit);
      }
    }

    return {
      rowIndex,
      date,
      description,
      type,
      amount,
      currency,
      include: date !== null && amount !== null && amount > 0,
      raw: cells,
    };
  });
}

/** Deterministic id so re-importing the same statement row is idempotent. */
export function rowExternalId(prefix: string, row: ParsedRow): string {
  const key = `${row.date}|${row.type}|${row.amount}|${row.description}`.slice(
    0,
    180
  );
  return `${prefix}:${key}`;
}

export function parsedRowToInput(
  row: ParsedRow,
  source: TransactionInput["source"],
  externalIdPrefix: string
): TransactionInput | null {
  if (!row.include || !row.date || row.amount === null || row.amount <= 0) {
    return null;
  }
  return {
    type: row.type,
    amount: row.amount,
    currency: row.currency,
    date: row.date,
    merchant: row.description || null,
    source,
    externalId: rowExternalId(externalIdPrefix, row),
    sourceMetadata: { imported_row: row.raw },
  };
}
