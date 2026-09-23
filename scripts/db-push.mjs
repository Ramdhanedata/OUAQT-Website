/*
 * Applies the migration files in builder/db/migrations to the database named
 * by SUPABASE_DB_URL, in order, once each.
 *
 * Runs on your own machine, never in a deploy. It keeps a table of what it has
 * already applied, so running it twice is safe and adding a file later only
 * runs that file.
 *
 *   npm run db:push
 *   npm run db:push -- --until 0019    stop after 0019, for a change that
 *                                      must wait until new code is deployed
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const DIR = join(process.cwd(), "builder", "db", "migrations");
const url = (process.env.SUPABASE_DB_URL ?? "").trim();

if (!url) {
  console.error(
    "SUPABASE_DB_URL is empty.\n" +
      "Supabase dashboard > Connect > Session pooler > copy the URI, and put " +
      "your database password in place of [YOUR-PASSWORD]."
  );
  process.exit(1);
}

async function connect() {
  // Supabase serves a publicly signed certificate, so verification should
  // hold. Some networks break the chain; say so rather than failing silently.
  const client = new pg.Client({ connectionString: url });
  try {
    await client.connect();
    return client;
  } catch (error) {
    if (!/certificate|self-signed|SSL/i.test(String(error))) throw error;
    console.warn("Certificate could not be verified, connecting unverified.");
    const fallback = new pg.Client({
      connectionString: url,
      ssl: { rejectUnauthorized: false },
    });
    await fallback.connect();
    return fallback;
  }
}

const client = await connect();

await client.query(`
  create table if not exists schema_migrations (
    filename   text primary key,
    applied_at timestamptz not null default now()
  )
`);

const applied = new Set(
  (await client.query("select filename from schema_migrations")).rows.map(
    (r) => r.filename
  )
);

/* --until 0019: apply up to and including the file that starts with 0019. */
const untilAt = process.argv.indexOf("--until");
const until = untilAt === -1 ? null : process.argv[untilAt + 1];
if (untilAt !== -1 && !/^\d{4}$/.test(until ?? "")) {
  console.error("--until takes a four-digit migration number, such as 0019.");
  process.exit(1);
}

const files = readdirSync(DIR)
  .filter((f) => f.endsWith(".sql"))
  .filter((f) => until === null || f.slice(0, 4) <= until)
  .sort();

let ran = 0;
for (const file of files) {
  if (applied.has(file)) {
    console.log(`  already applied  ${file}`);
    continue;
  }
  const sql = readFileSync(join(DIR, file), "utf8");
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("insert into schema_migrations (filename) values ($1)", [
      file,
    ]);
    await client.query("commit");
    console.log(`  applied          ${file}`);
    ran += 1;
  } catch (error) {
    await client.query("rollback");
    console.error(`\nFailed on ${file}, nothing from this file was kept.\n`);
    console.error(error.message);
    await client.end();
    process.exit(1);
  }
}

await client.end();
console.log(
  ran === 0 ? "\nNothing to do, the database is up to date." : `\n${ran} applied.`
);
