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

export type AdminGate =
  | { allowed: true; staff: Staff }
  | { allowed: false; reason: "signed_out" | "needs_second_factor" | "not_staff" };

export async function adminGate(): Promise<AdminGate> {
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
