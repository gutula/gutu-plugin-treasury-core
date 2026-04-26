/** Bank statement import + reconciliation.
 *
 *  Import: a CSV statement → bank_statements + bank_statement_lines.
 *  We keep the parser strict but tolerant — accepts columns named in
 *  any reasonable case, and maps them to (date, description, debit,
 *  credit, amount, reference). The line's signed amount is stored as
 *  positive=credit (deposit) / negative=debit (payment) in minor units.
 *
 *  Reconciliation: for each unmatched statement line, propose
 *  candidate GL entries on the bank account that:
 *    - have the same sign + magnitude (within rounding),
 *    - have a posting_date within ±N days,
 *    - aren't already matched (matched_entry_id NULL).
 *  The user confirms; we set matched_entry_id and status='matched'.
 *
 *  Reconciliation never modifies the GL — it only annotates statement
 *  lines with their matched journal entry. To create a missing GL
 *  entry from a statement line, the user posts a journal explicitly
 *  through the GL routes (we expose a quick-post helper that wraps
 *  postJournal with a sensible default contra account).
 */

import { db, nowIso } from "@gutu-host";
import { uuid } from "@gutu-host";
import { postJournal, type JournalLineInput } from "@gutu-plugin/accounting-core";
import { recordAudit } from "@gutu-host";

export interface BankStatement {
  id: string;
  tenantId: string;
  bankAccountId: string;
  label: string;
  fromDate: string;
  toDate: string;
  currency: string;
  openingMinor: number;
  closingMinor: number;
  createdBy: string;
  createdAt: string;
  lines: BankStatementLine[];
}

export interface BankStatementLine {
  id: string;
  statementId: string;
  postingDate: string;
  description: string | null;
  reference: string | null;
  amountMinor: number;
  currency: string;
  matchedEntryId: string | null;
  status: "unmatched" | "matched" | "ignored";
  createdAt: string;
}

export class BankReconError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "BankReconError";
  }
}

/* ----------------------------- CSV parsing ------------------------------- */

export interface ParsedStatementLine {
  postingDate: string;
  description: string;
  reference: string | null;
  amountMinor: number;
}

const HEADER_ALIASES: Record<string, string[]> = {
  date: ["date", "posting date", "transaction date", "value date", "txn date"],
  description: ["description", "narration", "details", "memo", "particulars"],
  reference: ["reference", "ref", "cheque", "check", "txn id"],
  amount: ["amount", "txn amount"],
  debit: ["debit", "withdrawal", "out"],
  credit: ["credit", "deposit", "in"],
};

function indexOfAlias(headers: string[], aliases: string[]): number {
  const norm = headers.map((h) => h.trim().toLowerCase());
  for (const alias of aliases) {
    const idx = norm.indexOf(alias);
    if (idx >= 0) return idx;
  }
  return -1;
}

function parseAmount(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[ ,]/g, "").replace(/[^\d.\-+()]/g, "");
  if (!cleaned) return 0;
  const negativeParen = /^\(.*\)$/.test(cleaned);
  const num = Number(negativeParen ? `-${cleaned.slice(1, -1)}` : cleaned);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100);
}

/** Strict CSV parser (re-uses the bulk-import shape but accepts an
 *  inline implementation to avoid a circular import). */
function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = [];
  let cur: string[] = [];
  let cell = "";
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      cell += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      cur.push(cell);
      cell = "";
      i++;
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      cur.push(cell);
      cell = "";
      rows.push(cur);
      cur = [];
      if (ch === "\r" && text[i + 1] === "\n") i += 2;
      else i++;
      continue;
    }
    cell += ch;
    i++;
  }
  if (cell.length > 0 || cur.length > 0) {
    cur.push(cell);
    rows.push(cur);
  }
  if (rows.length === 0) return { headers: [], rows: [] };
  return { headers: rows[0]!, rows: rows.slice(1).filter((r) => !(r.length === 1 && r[0] === "")) };
}

export function parseStatementCsv(text: string): ParsedStatementLine[] {
  const { headers, rows } = parseCsv(text);
  if (headers.length === 0) return [];
  const dateIdx = indexOfAlias(headers, HEADER_ALIASES.date!);
  if (dateIdx === -1) throw new BankReconError("invalid", "CSV missing a date column");
  const descIdx = indexOfAlias(headers, HEADER_ALIASES.description!);
  const refIdx = indexOfAlias(headers, HEADER_ALIASES.reference!);
  const amountIdx = indexOfAlias(headers, HEADER_ALIASES.amount!);
  const debitIdx = indexOfAlias(headers, HEADER_ALIASES.debit!);
  const creditIdx = indexOfAlias(headers, HEADER_ALIASES.credit!);
  if (amountIdx === -1 && debitIdx === -1 && creditIdx === -1)
    throw new BankReconError("invalid", "CSV missing amount/debit/credit columns");
  return rows.map((cells) => {
    const dateRaw = (cells[dateIdx] ?? "").trim();
    const date = normaliseDate(dateRaw);
    let amount = 0;
    if (amountIdx >= 0) {
      amount = parseAmount(cells[amountIdx] ?? "");
    } else {
      const dr = parseAmount(cells[debitIdx] ?? "");
      const cr = parseAmount(cells[creditIdx] ?? "");
      // Convention: positive=credit (deposit). Debit subtracts.
      amount = cr - dr;
    }
    return {
      postingDate: date,
      description: descIdx >= 0 ? (cells[descIdx] ?? "").trim() : "",
      reference: refIdx >= 0 ? (cells[refIdx] ?? "").trim() || null : null,
      amountMinor: amount,
    };
  });
}

function normaliseDate(raw: string): string {
  // Accept ISO (yyyy-mm-dd), US (mm/dd/yyyy), EU (dd/mm/yyyy), or
  // bank-style yyyy/mm/dd. We bias toward ISO output.
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  const m = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/.exec(trimmed);
  if (m) {
    // Heuristic: if the first part > 12, it's day-first; else month-first.
    const first = Number(m[1]);
    const second = Number(m[2]);
    const year = m[3];
    if (first > 12) {
      return `${year}-${String(second).padStart(2, "0")}-${String(first).padStart(2, "0")}`;
    }
    return `${year}-${String(first).padStart(2, "0")}-${String(second).padStart(2, "0")}`;
  }
  // Last resort — pass through; the DB stores TEXT and the reporter
  // uses string comparison which is order-preserving for ISO.
  return trimmed.slice(0, 10);
}

/* ----------------------------- Storage ----------------------------------- */

export interface CreateStatementArgs {
  tenantId: string;
  bankAccountId: string;
  label: string;
  fromDate: string;
  toDate: string;
  currency: string;
  openingMinor?: number;
  closingMinor?: number;
  lines: ParsedStatementLine[];
  createdBy: string;
}

export function createStatement(args: CreateStatementArgs): BankStatement {
  const id = uuid();
  const now = nowIso();
  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO bank_statements
         (id, tenant_id, bank_account_id, label, from_date, to_date, currency,
          opening_minor, closing_minor, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      args.tenantId,
      args.bankAccountId,
      args.label,
      args.fromDate,
      args.toDate,
      args.currency,
      args.openingMinor ?? 0,
      args.closingMinor ?? 0,
      args.createdBy,
      now,
    );
    const stmt = db.prepare(
      `INSERT INTO bank_statement_lines
         (id, tenant_id, statement_id, posting_date, description, reference,
          amount_minor, currency, matched_entry_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 'unmatched', ?)`,
    );
    for (const line of args.lines) {
      stmt.run(
        uuid(),
        args.tenantId,
        id,
        line.postingDate,
        line.description,
        line.reference,
        line.amountMinor,
        args.currency,
        now,
      );
    }
  });
  tx();
  recordAudit({
    actor: args.createdBy,
    action: "bank-statement.imported",
    resource: "bank-statement",
    recordId: id,
    payload: {
      bankAccountId: args.bankAccountId,
      lineCount: args.lines.length,
    },
  });
  return getStatement(args.tenantId, id)!;
}

function lineFromDb(r: {
  id: string;
  statement_id: string;
  posting_date: string;
  description: string | null;
  reference: string | null;
  amount_minor: number;
  currency: string;
  matched_entry_id: string | null;
  status: "unmatched" | "matched" | "ignored";
  created_at: string;
}): BankStatementLine {
  return {
    id: r.id,
    statementId: r.statement_id,
    postingDate: r.posting_date,
    description: r.description,
    reference: r.reference,
    amountMinor: r.amount_minor,
    currency: r.currency,
    matchedEntryId: r.matched_entry_id,
    status: r.status,
    createdAt: r.created_at,
  };
}

export function getStatement(tenantId: string, id: string): BankStatement | null {
  const row = db
    .prepare(`SELECT * FROM bank_statements WHERE id = ? AND tenant_id = ?`)
    .get(id, tenantId) as
      | {
          id: string;
          tenant_id: string;
          bank_account_id: string;
          label: string;
          from_date: string;
          to_date: string;
          currency: string;
          opening_minor: number;
          closing_minor: number;
          created_by: string;
          created_at: string;
        }
      | undefined;
  if (!row) return null;
  const lines = (
    db
      .prepare(
        `SELECT * FROM bank_statement_lines
           WHERE statement_id = ? ORDER BY posting_date ASC, created_at ASC`,
      )
      .all(id) as never[]
  ).map(lineFromDb);
  return {
    id: row.id,
    tenantId: row.tenant_id,
    bankAccountId: row.bank_account_id,
    label: row.label,
    fromDate: row.from_date,
    toDate: row.to_date,
    currency: row.currency,
    openingMinor: row.opening_minor,
    closingMinor: row.closing_minor,
    createdBy: row.created_by,
    createdAt: row.created_at,
    lines,
  };
}

export function listStatements(tenantId: string): BankStatement[] {
  const rows = db
    .prepare(
      `SELECT id FROM bank_statements WHERE tenant_id = ? ORDER BY from_date DESC`,
    )
    .all(tenantId) as Array<{ id: string }>;
  return rows.map((r) => getStatement(tenantId, r.id)!).filter(Boolean);
}

/* ----------------------------- Matching ---------------------------------- */

export interface MatchCandidate {
  glEntryId: string;
  journalId: string;
  postingDate: string;
  amountMinor: number;
  currency: string;
  memo: string | null;
  /** Confidence 0..1 — higher when amount matches exactly + nearby date. */
  score: number;
}

export interface SuggestMatchesArgs {
  tenantId: string;
  lineId: string;
  /** ± days around posting date. Default 5. */
  windowDays?: number;
  limit?: number;
}

export function suggestMatches(args: SuggestMatchesArgs): MatchCandidate[] {
  const lineRow = db
    .prepare(
      `SELECT bsl.*, bs.bank_account_id as bank_account_id
         FROM bank_statement_lines bsl
         JOIN bank_statements bs ON bs.id = bsl.statement_id
        WHERE bsl.tenant_id = ? AND bsl.id = ?`,
    )
    .get(args.tenantId, args.lineId) as
      | (Parameters<typeof lineFromDb>[0] & { bank_account_id: string })
      | undefined;
  if (!lineRow) throw new BankReconError("not-found", "Statement line not found");
  if (lineRow.matched_entry_id) return [];

  const window = args.windowDays ?? 5;
  const dayMs = 24 * 60 * 60 * 1000;
  const lineDate = new Date(lineRow.posting_date);
  const fromIso = new Date(lineDate.getTime() - window * dayMs).toISOString().slice(0, 10);
  const toIso = new Date(lineDate.getTime() + window * dayMs).toISOString().slice(0, 10);

  // Bank account postings: positive amount on a debit-normal account
  // (asset:bank) means a debit GL entry (money in). Statement convention:
  // amount positive = credit/deposit. So bank-account *debit* GL entry
  // matches a *positive* statement line; bank-account *credit* GL
  // entry matches a *negative* statement line.
  const sign = lineRow.amount_minor >= 0 ? "debit" : "credit";
  const absAmount = Math.abs(lineRow.amount_minor);

  const candidates = db
    .prepare(
      `SELECT e.id as glEntryId, e.journal_id as journalId, e.posting_date as postingDate,
              e.amount_minor as amountMinor, e.currency, e.memo as memo
         FROM gl_entries e
        WHERE e.tenant_id = ?
          AND e.account_id = ?
          AND e.side = ?
          AND e.posting_date BETWEEN ? AND ?
          AND e.amount_minor BETWEEN ? AND ?
          AND e.id NOT IN (
            SELECT matched_entry_id FROM bank_statement_lines
              WHERE tenant_id = ? AND matched_entry_id IS NOT NULL
          )
        ORDER BY ABS(e.amount_minor - ?) ASC, e.posting_date ASC
        LIMIT ?`,
    )
    .all(
      args.tenantId,
      lineRow.bank_account_id,
      sign,
      fromIso,
      toIso,
      Math.floor(absAmount * 0.99),
      Math.ceil(absAmount * 1.01),
      args.tenantId,
      absAmount,
      args.limit ?? 10,
    ) as MatchCandidate[];

  return candidates.map((c) => {
    const amountDelta = Math.abs(c.amountMinor - absAmount);
    const dateDelta = Math.abs(
      new Date(c.postingDate).getTime() - lineDate.getTime(),
    ) / dayMs;
    const score = Math.max(
      0,
      1 -
        amountDelta / Math.max(1, absAmount) -
        dateDelta / Math.max(1, window) / 2,
    );
    return { ...c, score: Number(score.toFixed(4)) };
  });
}

export function matchLine(args: {
  tenantId: string;
  lineId: string;
  glEntryId: string;
  matchedBy: string;
}): BankStatementLine {
  const tx = db.transaction(() => {
    const line = db
      .prepare(
        `SELECT id, status, matched_entry_id FROM bank_statement_lines
           WHERE id = ? AND tenant_id = ?`,
      )
      .get(args.lineId, args.tenantId) as
        | { id: string; status: string; matched_entry_id: string | null }
        | undefined;
    if (!line) throw new BankReconError("not-found", "Line not found");
    if (line.status !== "unmatched")
      throw new BankReconError("conflict", `Line is already ${line.status}`);

    const entry = db
      .prepare(`SELECT id FROM gl_entries WHERE tenant_id = ? AND id = ?`)
      .get(args.tenantId, args.glEntryId);
    if (!entry) throw new BankReconError("not-found", "GL entry not found");

    const conflict = db
      .prepare(
        `SELECT id FROM bank_statement_lines WHERE tenant_id = ? AND matched_entry_id = ?`,
      )
      .get(args.tenantId, args.glEntryId);
    if (conflict)
      throw new BankReconError("conflict", "GL entry already matched to another line");

    db.prepare(
      `UPDATE bank_statement_lines
         SET matched_entry_id = ?, status = 'matched'
       WHERE id = ?`,
    ).run(args.glEntryId, args.lineId);
  });
  tx();
  recordAudit({
    actor: args.matchedBy,
    action: "bank-line.matched",
    resource: "bank-statement-line",
    recordId: args.lineId,
    payload: { glEntryId: args.glEntryId },
  });
  return getStatementLine(args.tenantId, args.lineId)!;
}

export function unmatchLine(tenantId: string, lineId: string, actor: string): BankStatementLine {
  db.prepare(
    `UPDATE bank_statement_lines
       SET matched_entry_id = NULL, status = 'unmatched'
       WHERE id = ? AND tenant_id = ?`,
  ).run(lineId, tenantId);
  recordAudit({
    actor,
    action: "bank-line.unmatched",
    resource: "bank-statement-line",
    recordId: lineId,
  });
  return getStatementLine(tenantId, lineId)!;
}

export function ignoreLine(tenantId: string, lineId: string, actor: string): BankStatementLine {
  db.prepare(
    `UPDATE bank_statement_lines SET status = 'ignored' WHERE id = ? AND tenant_id = ?`,
  ).run(lineId, tenantId);
  recordAudit({
    actor,
    action: "bank-line.ignored",
    resource: "bank-statement-line",
    recordId: lineId,
  });
  return getStatementLine(tenantId, lineId)!;
}

export function getStatementLine(tenantId: string, id: string): BankStatementLine | null {
  const r = db
    .prepare(`SELECT * FROM bank_statement_lines WHERE id = ? AND tenant_id = ?`)
    .get(id, tenantId) as never as Parameters<typeof lineFromDb>[0] | undefined;
  return r ? lineFromDb(r) : null;
}

/** Quick-post a journal directly from a statement line. Posts a
 *  balanced two-leg entry (bank account on the matching side, contra
 *  account on the other), then auto-matches the line to the bank-side
 *  entry. */
export interface QuickPostArgs {
  tenantId: string;
  lineId: string;
  contraAccountId: string;
  memo?: string;
  postedBy: string;
}

export function quickPostFromLine(args: QuickPostArgs): {
  journalId: string;
  matchedLineId: string;
} {
  const line = db
    .prepare(
      `SELECT bsl.*, bs.bank_account_id as bankAccountId, bs.label as stmtLabel
         FROM bank_statement_lines bsl
         JOIN bank_statements bs ON bs.id = bsl.statement_id
        WHERE bsl.tenant_id = ? AND bsl.id = ?`,
    )
    .get(args.tenantId, args.lineId) as
      | (Parameters<typeof lineFromDb>[0] & { bankAccountId: string; stmtLabel: string })
      | undefined;
  if (!line) throw new BankReconError("not-found", "Statement line not found");
  if (line.status !== "unmatched")
    throw new BankReconError("conflict", `Line is already ${line.status}`);
  const isCredit = line.amount_minor >= 0;
  const amount = Math.abs(line.amount_minor);
  const lines: JournalLineInput[] = [
    {
      accountId: line.bankAccountId,
      side: isCredit ? "debit" : "credit",
      amountMinor: amount,
      memo: line.description ?? `Bank: ${line.stmtLabel}`,
    },
    {
      accountId: args.contraAccountId,
      side: isCredit ? "credit" : "debit",
      amountMinor: amount,
      memo: line.description ?? `Bank: ${line.stmtLabel}`,
    },
  ];
  const journal = postJournal({
    tenantId: args.tenantId,
    number: `BANK-${line.id.slice(0, 6)}`,
    postingDate: line.posting_date,
    memo: args.memo ?? line.description ?? `Bank: ${line.stmtLabel}`,
    sourceResource: "bank-statement-line",
    sourceRecordId: line.id,
    idempotencyKey: `bank-line:${line.id}`,
    currency: line.currency,
    lines,
    createdBy: args.postedBy,
  });
  const bankEntry = journal.entries.find((e) => e.accountId === line.bankAccountId)!;
  matchLine({
    tenantId: args.tenantId,
    lineId: args.lineId,
    glEntryId: bankEntry.id,
    matchedBy: args.postedBy,
  });
  return { journalId: journal.id, matchedLineId: args.lineId };
}
