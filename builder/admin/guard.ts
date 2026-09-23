import "server-only";

import { sessionClient } from "@/builder/db/server";

/*
 * Who is allowed into /admin.
 *
 * Three things have to be true:
 *
 *   1. there is a session
 *   2. the user is in admin_users
 *   3. it has passed a second factor this time, not merely once long ago
 *
 * Membership is checked before the second factor, which costs a query and is
 * worth it. A shop owner signed in on the same browser who lands here should
 * be told this is not for him, not asked for a code from an authenticator he
 * has never set up.
 *
 * The third is the one worth spelling out. Supabase calls it the assurance
 * level: aal1 means a password, aal2 means a password and a code from the
 * phone. An admin account protected by a password alone is one leaked
 * password away from somebody confirming their own payments.
 */

export type Staff = { id: string; name: string | null };

/*
 * Test deployments, open without a login. Decided 2026-09-23 so the builder
 * can be tested without an email, a password and an authenticator.
 *
 * Open only when all of these hold, so it can never reach a real shop:
 *
 *   - the deployment is not production. Vercel says "production" for main,
 *     "preview" for branches, and nothing at all on a developer's machine.
 *   - the database is the test project, ouaqt-builder-test. A preview
 *     pointed at the production database stays locked, whatever else is true.
 *
 * The test project holds invented shops only. Anyone who has the preview link
 * can use this admin area while it is open, which is the price of no login.
 */
const TEST_PROJECT_REF = "vpdbkhykiylhigkwacvp"; // ouaqt-builder-test, public in its own URL

export function adminOpenForTesting(): boolean {
  if (process.env.VERCEL_ENV === "production") return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return url.includes(`//${TEST_PROJECT_REF}.supabase.co`);
}

export type AdminGate =
  | { allowed: true; staff: Staff }
  | { allowed: false; reason: "signed_out" | "needs_second_factor" | "not_staff" };

export async function adminGate(): Promise<AdminGate> {
  /*
   * Open for testing: act as the test staff account, so every confirmation,
   * grant and setting change is still written down against somebody.
   */
  if (adminOpenForTesting()) {
    const { adminClient } = await import("@/builder/db/server");
    const admin = adminClient();
    const { data: first } = admin
      ? await admin.from("admin_users").select("user_id").order("created_at").limit(1).maybeSingle()
      : { data: null };
    /* No name here: the menu says "test, no sign-in" in the reader's language. */
    if (first) return { allowed: true, staff: { id: first.user_id, name: null } };
  }

  const supabase = sessionClient();
  if (!supabase) return { allowed: false, reason: "signed_out" };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user || auth.user.is_anonymous) {
    return { allowed: false, reason: "signed_out" };
  }

  /*
   * admin_users has row level security on with no policy at all, so nobody
   * reads it from a browser. The membership check runs with the service role,
   * which is the only thing that can see it.
   */
  const { adminClient } = await import("@/builder/db/server");
  const admin = adminClient();
  if (!admin) return { allowed: false, reason: "not_staff" };

  const { data: staff } = await admin
    .from("admin_users")
    .select("user_id, name")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!staff) return { allowed: false, reason: "not_staff" };

  const { data: levels } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (levels?.currentLevel !== "aal2") {
    return { allowed: false, reason: "needs_second_factor" };
  }

  return { allowed: true, staff: { id: staff.user_id, name: staff.name } };
}
