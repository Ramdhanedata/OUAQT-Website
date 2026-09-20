/*
 * Where the builder's database lives, and the keys that reach it.
 *
 * The URL and the anon key are public. They ship to the browser, and every
 * request they make is still checked by row level security, which is why the
 * schema puts a policy on every table. The service role key is different: it
 * goes past every policy, so it is read in server code only and is never
 * prefixed NEXT_PUBLIC_.
 *
 * Nothing here throws while the module loads. A missing key means the builder
 * is not configured yet, and the pages that need it say so plainly instead of
 * taking the marketing site down with them.
 */

export const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
export const supabaseAnonKey = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
).trim();

/** True when the browser side has everything it needs to talk to the database. */
export const supabaseConfigured = supabaseUrl !== "" && supabaseAnonKey !== "";

/**
 * Server only. Bypasses row level security, so it belongs in route handlers
 * and server components, never in anything sent to the browser. Returns an
 * empty string when unset; callers check before using it.
 */
export function serviceRoleKey(): string {
  return (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
}
