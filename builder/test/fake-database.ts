/*
 * Enough of the Supabase client, held in memory, to run the real routes in a
 * test: the query builder's filters, inserts, updates, upserts and deletes,
 * one level of embedded tables, a storage bucket per name and a signed-in
 * visitor. Postgres's own defaults that the code relies on (ids, created_at,
 * a device's status) are filled in on insert.
 *
 * It checks no column names and runs no SQL: a test over it proves the
 * routes hand each other the right things, not that the schema agrees.
 */

type Row = Record<string, unknown>;
type Filter = (row: Row) => boolean;

/* Embedded tables, as "businesses(name_latin)" in a select: the one row a key points at, or the rows pointing back. */
const SINGULAR: Record<string, string> = { businesses: "business", licences: "licence", devices: "device", builder_drafts: "draft" };
const singular = (table: string) => SINGULAR[table] ?? table.replace(/s$/, "");

const DEFAULTS: Record<string, () => Row> = {
  devices: () => ({ status: "active", first_seen: new Date().toISOString(), last_seen: new Date().toISOString() }),
  payments: () => ({ status: "pending_confirmation" }),
};

export function fakeDatabase(user: { id: string } | null = null) {
  const tables: Record<string, Row[]> = {};
  const files = new Map<string, ArrayBuffer | string>();
  const rowsOf = (table: string) => (tables[table] ??= []);

  const compare = (value: unknown, other: unknown) => String(value ?? "").localeCompare(String(other ?? ""));

  function embedded(table: string, row: Row, columns: string): Row {
    const out = { ...row };
    for (const match of columns.matchAll(/(\w+)(?:!\w+)?\(([^()]*)\)/g)) {
      const other = match[1];
      const pointer = `${singular(other)}_id`;
      if (pointer in row) {
        out[other] = rowsOf(other).find((one) => one.id === row[pointer]) ?? null;
      } else {
        const back = `${singular(table)}_id`;
        out[other] = rowsOf(other).filter((one) => one[back] === row.id);
      }
    }
    return out;
  }

  function from(table: string) {
    const filters: Filter[] = [];
    let mode: "select" | "insert" | "update" | "upsert" | "delete" = "select";
    let values: Row[] = [];
    let patch: Row = {};
    let conflict: string[] = ["id"];
    let columns = "*";
    let returning = false;
    const order: { column: string; ascending: boolean }[] = [];
    let limit: number | null = null;
    let head = false;

    const withDefaults = (row: Row): Row => ({
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...(DEFAULTS[table]?.() ?? {}),
      ...row,
    });

    async function run(): Promise<{ data: unknown; error: null; count?: number }> {
      let touched: Row[] = [];
      if (mode === "insert") {
        touched = values.map(withDefaults);
        rowsOf(table).push(...touched);
      } else if (mode === "upsert") {
        for (const value of values) {
          const same = rowsOf(table).find((row) => conflict.every((key) => row[key] === value[key]));
          if (same) {
            Object.assign(same, value);
            touched.push(same);
          } else {
            const fresh = withDefaults(value);
            rowsOf(table).push(fresh);
            touched.push(fresh);
          }
        }
      } else if (mode === "update") {
        touched = rowsOf(table).filter((row) => filters.every((keep) => keep(row)));
        touched.forEach((row) => Object.assign(row, patch));
      } else if (mode === "delete") {
        touched = rowsOf(table).filter((row) => filters.every((keep) => keep(row)));
        tables[table] = rowsOf(table).filter((row) => !touched.includes(row));
      } else {
        touched = rowsOf(table).filter((row) => filters.every((keep) => keep(row)));
      }

      if (mode !== "select" && !returning) return { data: null, error: null };
      let rows = [...touched];
      for (const { column, ascending } of [...order].reverse()) rows.sort((a, b) => (ascending ? 1 : -1) * compare(a[column], b[column]));
      const count = rows.length;
      if (limit !== null) rows = rows.slice(0, limit);
      if (head) return { data: null, error: null, count };
      return { data: rows.map((row) => embedded(table, row, columns)), error: null, count };
    }

    const builder = {
      select(chosen = "*", options?: { head?: boolean }) {
        if (mode === "select") columns = chosen;
        else {
          returning = true;
          columns = chosen;
        }
        head = Boolean(options?.head);
        return builder;
      },
      insert(value: Row | Row[]) {
        mode = "insert";
        values = Array.isArray(value) ? value : [value];
        return builder;
      },
      upsert(value: Row | Row[], options?: { onConflict?: string }) {
        mode = "upsert";
        values = Array.isArray(value) ? value : [value];
        if (options?.onConflict) conflict = options.onConflict.split(",").map((key) => key.trim());
        return builder;
      },
      update(value: Row) {
        mode = "update";
        patch = value;
        return builder;
      },
      delete() {
        mode = "delete";
        return builder;
      },
      eq(key: string, value: unknown) {
        filters.push((row) => row[key] === value);
        return builder;
      },
      neq(key: string, value: unknown) {
        filters.push((row) => row[key] !== value);
        return builder;
      },
      is(key: string, value: unknown) {
        filters.push((row) => (row[key] ?? null) === value);
        return builder;
      },
      not(key: string, operator: string, value: unknown) {
        filters.push((row) => (operator === "is" ? (row[key] ?? null) !== value : row[key] !== value));
        return builder;
      },
      in(key: string, list: unknown[]) {
        filters.push((row) => list.includes(row[key]));
        return builder;
      },
      gt(key: string, value: unknown) {
        filters.push((row) => row[key] != null && compare(row[key], value) > 0);
        return builder;
      },
      gte(key: string, value: unknown) {
        filters.push((row) => row[key] != null && compare(row[key], value) >= 0);
        return builder;
      },
      lt(key: string, value: unknown) {
        filters.push((row) => row[key] != null && compare(row[key], value) < 0);
        return builder;
      },
      lte(key: string, value: unknown) {
        filters.push((row) => row[key] != null && compare(row[key], value) <= 0);
        return builder;
      },
      contains(key: string, value: unknown[]) {
        filters.push((row) => Array.isArray(row[key]) && value.every((one) => (row[key] as unknown[]).includes(one)));
        return builder;
      },
      or() {
        return builder;
      },
      order(column: string, options?: { ascending?: boolean }) {
        order.push({ column, ascending: options?.ascending ?? true });
        return builder;
      },
      limit(count: number) {
        limit = count;
        return builder;
      },
      range(start: number, end: number) {
        limit = end - start + 1;
        return builder;
      },
      returns() {
        return builder;
      },
      async maybeSingle() {
        const { data } = await run();
        return { data: (data as Row[] | null)?.[0] ?? null, error: null };
      },
      async single() {
        const { data } = await run();
        const one = (data as Row[] | null)?.[0] ?? null;
        return one ? { data: one, error: null } : { data: null, error: { message: "no rows", code: "PGRST116" } };
      },
      then(resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) {
        return run().then(resolve, reject);
      },
    };
    return builder;
  }

  const client = {
    from,
    rpc: async (name: string) => ({ data: null, error: { message: `no function ${name} in the test database` } }),
    auth: {
      getUser: async () => ({ data: { user }, error: null }),
      admin: { getUserById: async () => ({ data: { user: { email: "" } }, error: null }) },
    },
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, body: ArrayBuffer | string) => {
          files.set(`${bucket}/${path}`, body);
          return { data: { path }, error: null };
        },
        download: async (path: string) => {
          const body = files.get(`${bucket}/${path}`);
          return body === undefined ? { data: null, error: { message: "not found" } } : { data: new Blob([body]), error: null };
        },
        remove: async (paths: string[]) => {
          for (const path of paths) files.delete(`${bucket}/${path}`);
          return { data: null, error: null };
        },
        createSignedUrl: async (path: string) => ({ data: { signedUrl: `https://files.test/${bucket}/${path}` }, error: null }),
      }),
    },
  };

  return { client, tables, files, rowsOf };
}
