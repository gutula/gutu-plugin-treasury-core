import { describe, expect, it } from "bun:test";

import {
  buildTreasuryCoreSqliteMigrationSql,
  buildTreasuryCoreSqliteRollbackSql,
  getTreasuryCoreSqliteLookupIndexName,
  getTreasuryCoreSqliteStatusIndexName
} from "../../src/sqlite";

describe("treasury-core sqlite helpers", () => {
  it("creates the business tables and indexes", () => {
    const sql = buildTreasuryCoreSqliteMigrationSql().join("\n");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS treasury_core_primary_records");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS treasury_core_secondary_records");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS treasury_core_exception_records");
    expect(sql).toContain(getTreasuryCoreSqliteLookupIndexName("treasury_core_"));
    expect(sql).toContain(getTreasuryCoreSqliteStatusIndexName("treasury_core_"));
  });

  it("rolls the sqlite tables back safely", () => {
    const sql = buildTreasuryCoreSqliteRollbackSql({ tablePrefix: "treasury_core_preview_" }).join("\n");
    expect(sql).toContain("DROP TABLE IF EXISTS treasury_core_preview_exception_records");
  });
});
