import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/*
 * The promise that the shop's trade stays on the shop's computers is only as
 * good as the schema. This reads every migration and fails if one creates a
 * place to put sales, stock movements, credit balances, cash closes or
 * backups on the server.
 */
const FORBIDDEN =
  /\b(sale|sales|sale_line|stock_movement|stock_movements|credit_balance|customer_credit|cash_close|caisse_close|backup|backups|inventory_count)\b/i;

const dir = path.join(__dirname, "migrations");
const migrations = fs.readdirSync(dir).filter((file) => file.endsWith(".sql"));

describe("no business data on the server", () => {
  it("has migrations to check", () => {
    expect(migrations.length).toBeGreaterThan(0);
  });

  it.each(migrations)("%s creates no table or column for trade records", (file) => {
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    const offenders = sql
      .split("\n")
      .map((line, index) => ({ line: line.trim(), number: index + 1 }))
      // Comments explain the rule and name the very words it forbids.
      .filter(({ line }) => !line.startsWith("--") && FORBIDDEN.test(line));
    expect(offenders).toEqual([]);
  });
});
