import { describe, expect, it } from "bun:test";

import {
  buildTreasuryCoreMigrationSql,
  buildTreasuryCoreRollbackSql,
  getTreasuryCoreLookupIndexName,
  getTreasuryCoreStatusIndexName
} from "../../src/postgres";

describe("treasury-core postgres helpers", () => {
  it("creates the business tables and indexes", () => {
    const sql = buildTreasuryCoreMigrationSql().join("\n");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS treasury_core.primary_records");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS treasury_core.secondary_records");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS treasury_core.exception_records");
    expect(sql).toContain(getTreasuryCoreLookupIndexName());
    expect(sql).toContain(getTreasuryCoreStatusIndexName());
  });

  it("rolls the schema back safely", () => {
    const sql = buildTreasuryCoreRollbackSql({ schemaName: "treasury_core_preview", dropSchema: true }).join("\n");
    expect(sql).toContain("DROP TABLE IF EXISTS treasury_core_preview.exception_records");
    expect(sql).toContain("DROP SCHEMA IF EXISTS treasury_core_preview CASCADE");
  });
});
