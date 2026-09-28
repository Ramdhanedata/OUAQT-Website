import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/*
 * Turning a confirmed payment into licence time, and taking it back.
 *
 * One place for it, because two paths confirm: a person in the admin area,
 * and a payment whose screenshot was read and matched (see 0022). Both must
 * buy exactly the same thing, and an automatic one must be undoable exactly.
 */

/*
 * How long each plan buys. These are what the words mean rather than prices
 * anybody administers: an annual licence is a year.
 */
const MONTHS: Record<string, number | null> = {
  annual: 12, // not-a-rule: a year
  semiannual: 6, // not-a-rule: half a year
  quarterly: 3, // not-a-rule: a quarter
  extra_device: 12, // not-a-rule: runs with the annual licence
  perpetual: null,
  setup_visit: null,
};

function addMonths(from: Date, months: number): Date {
  const out = new Date(from);
  out.setUTCMonth(out.getUTCMonth() + months);
  return out;
}

/** The licence as it was, kept with an automatic confirmation. */
export type LicenceBefore = {
  id: string;
  existed: boolean;
  plan: string | null;
  status: string | null;
  starts_at: string | null;
  ends_at: string | null;
};

export async function grantLicence(
  admin: SupabaseClient,
  payment: { business_id: string; plan: string },
  now = new Date()
): Promise<{ ok: true; endsAt: string | null; licenceId: string; before: LicenceBefore } | { ok: false }> {
  const { data: licence } = await admin
    .from("licences")
    .select("id, plan, status, starts_at, ends_at")
    .eq("business_id", payment.business_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const months = MONTHS[payment.plan] ?? null;

  /*
   * Time is added to whichever is later: today, or the end he already has.
   * Paying early should not cost an owner the days he has left.
   */
  const from = licence?.ends_at && new Date(licence.ends_at) > now ? new Date(licence.ends_at) : now;
  const endsAt = months ? addMonths(from, months).toISOString() : null;

  const shape = {
    /* A licence is annual in kind whatever the length paid for; the dates say how long. */
    plan: payment.plan === "quarterly" || payment.plan === "semiannual" ? "annual" : payment.plan,
    status: "active",
    starts_at: licence?.starts_at ?? now.toISOString(),
    ends_at: endsAt,
  };

  if (licence) {
    const { error } = await admin.from("licences").update(shape).eq("id", licence.id);
    if (error) return { ok: false };
    return {
      ok: true,
      endsAt,
      licenceId: licence.id,
      before: { id: licence.id, existed: true, plan: licence.plan, status: licence.status, starts_at: licence.starts_at, ends_at: licence.ends_at },
    };
  }

  const { data: created, error } = await admin
    .from("licences")
    .insert({ business_id: payment.business_id, renewal_secret: crypto.randomUUID(), ...shape })
    .select("id")
    .single();
  if (error || !created) return { ok: false };
  return {
    ok: true,
    endsAt,
    licenceId: created.id,
    before: { id: created.id, existed: false, plan: null, status: null, starts_at: null, ends_at: null },
  };
}

/*
 * Undoing an automatic confirmation: the licence goes back to what it was,
 * and one that the payment created goes away. The software follows at its
 * next check.
 */
export async function restoreLicence(admin: SupabaseClient, before: LicenceBefore): Promise<boolean> {
  if (!before.existed) {
    const { error } = await admin.from("licences").delete().eq("id", before.id);
    return !error;
  }
  const { error } = await admin
    .from("licences")
    .update({ plan: before.plan, status: before.status, starts_at: before.starts_at, ends_at: before.ends_at })
    .eq("id", before.id);
  return !error;
}
