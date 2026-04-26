/** Bank Reconciliation REST API.
 *
 *  Routes:
 *    GET   /statements                    list
 *    GET   /statements/:id                fetch one (with lines)
 *    POST  /statements/import             import CSV (text body or file)
 *    POST  /statements                    create from already-parsed lines
 *    GET   /lines/:id/suggestions         match candidates (?windowDays=)
 *    POST  /lines/:id/match               match a line to a GL entry
 *    POST  /lines/:id/unmatch
 *    POST  /lines/:id/ignore
 *    POST  /lines/:id/post                quick-post a journal + match
 */

import { Hono } from "@gutu-host";
import { requireAuth, currentUser } from "@gutu-host";
import { getTenantContext } from "@gutu-host";
import {
  BankReconError,
  createStatement,
  getStatement,
  ignoreLine,
  listStatements,
  matchLine,
  parseStatementCsv,
  quickPostFromLine,
  suggestMatches,
  unmatchLine,
} from "@gutu-plugin/treasury-core";

export const bankReconRoutes = new Hono();
bankReconRoutes.use("*", requireAuth);

function tenantId(): string {
  return getTenantContext()?.tenantId ?? "default";
}

function handle(err: unknown, c: Parameters<Parameters<typeof bankReconRoutes.get>[1]>[0]) {
  if (err instanceof BankReconError) return c.json({ error: err.message, code: err.code }, 400);
  throw err;
}

bankReconRoutes.get("/statements", (c) => c.json({ rows: listStatements(tenantId()) }));

bankReconRoutes.get("/statements/:id", (c) => {
  const s = getStatement(tenantId(), c.req.param("id"));
  if (!s) return c.json({ error: "not found" }, 404);
  return c.json(s);
});

bankReconRoutes.post("/statements/import", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const csv = typeof body.csv === "string" ? body.csv : "";
  if (!csv) return c.json({ error: "csv body required" }, 400);
  const user = currentUser(c);
  try {
    const lines = parseStatementCsv(csv);
    const s = createStatement({
      tenantId: tenantId(),
      bankAccountId: String(body.bankAccountId ?? ""),
      label: String(body.label ?? "Imported statement"),
      fromDate: String(body.fromDate ?? lines[0]?.postingDate ?? ""),
      toDate: String(body.toDate ?? lines[lines.length - 1]?.postingDate ?? ""),
      currency: String(body.currency ?? "USD"),
      openingMinor: typeof body.openingMinor === "number" ? body.openingMinor : 0,
      closingMinor: typeof body.closingMinor === "number" ? body.closingMinor : 0,
      lines,
      createdBy: user.email,
    });
    return c.json(s, 201);
  } catch (err) {
    return handle(err, c) as never;
  }
});

bankReconRoutes.post("/statements", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const user = currentUser(c);
  try {
    const s = createStatement({
      tenantId: tenantId(),
      bankAccountId: String(body.bankAccountId ?? ""),
      label: String(body.label ?? ""),
      fromDate: String(body.fromDate ?? ""),
      toDate: String(body.toDate ?? ""),
      currency: String(body.currency ?? "USD"),
      openingMinor: typeof body.openingMinor === "number" ? body.openingMinor : 0,
      closingMinor: typeof body.closingMinor === "number" ? body.closingMinor : 0,
      lines: Array.isArray(body.lines) ? (body.lines as never) : [],
      createdBy: user.email,
    });
    return c.json(s, 201);
  } catch (err) {
    return handle(err, c) as never;
  }
});

bankReconRoutes.get("/lines/:id/suggestions", (c) => {
  try {
    const out = suggestMatches({
      tenantId: tenantId(),
      lineId: c.req.param("id"),
      windowDays: c.req.query("windowDays") ? Number(c.req.query("windowDays")) : undefined,
      limit: c.req.query("limit") ? Math.min(Number(c.req.query("limit")), 50) : undefined,
    });
    return c.json({ rows: out });
  } catch (err) {
    return handle(err, c) as never;
  }
});

bankReconRoutes.post("/lines/:id/match", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const user = currentUser(c);
  try {
    const out = matchLine({
      tenantId: tenantId(),
      lineId: c.req.param("id"),
      glEntryId: String(body.glEntryId ?? ""),
      matchedBy: user.email,
    });
    return c.json(out);
  } catch (err) {
    return handle(err, c) as never;
  }
});

bankReconRoutes.post("/lines/:id/unmatch", (c) => {
  const user = currentUser(c);
  return c.json(unmatchLine(tenantId(), c.req.param("id"), user.email));
});

bankReconRoutes.post("/lines/:id/ignore", (c) => {
  const user = currentUser(c);
  return c.json(ignoreLine(tenantId(), c.req.param("id"), user.email));
});

bankReconRoutes.post("/lines/:id/post", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const user = currentUser(c);
  try {
    const out = quickPostFromLine({
      tenantId: tenantId(),
      lineId: c.req.param("id"),
      contraAccountId: String(body.contraAccountId ?? ""),
      memo: typeof body.memo === "string" ? body.memo : undefined,
      postedBy: user.email,
    });
    return c.json(out, 201);
  } catch (err) {
    return handle(err, c) as never;
  }
});
