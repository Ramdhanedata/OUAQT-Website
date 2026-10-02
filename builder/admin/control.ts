import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { LicenceStatus } from "@/app-ui/licence-status";
import { getPublicSettings } from "@/builder/db/settings";
import { CONTROL_GROUPS, controlGroupOf, daysUntil, type ControlGroup } from "./control-rules";
import { latestLicences, shopStatus, type LicenceRow } from "./overview-math";

/*
 * Every shop and the state of its software, for the Contrôle page: its
 * licence as the software reads it, how many computers run it and when one
 * last checked in, the phone it was built with, and a ban if there is one.
 */

const MANY = 5_000; // not-a-rule: a ceiling on each read, far above today's shop count

export type ControlRow = {
  id: string;
  name: string;
  pack: string;
  createdAt: string;
  phone: string | null;
  plan: string | null;
  gift: boolean;
  cancelled: boolean;
  status: LicenceStatus | null;
  group: ControlGroup;
  endsAt: string | null;
  daysLeft: number | null;
  computers: number;
  lastSeen: string | null;
  banned: { at: string; reason: string | null } | null;
};

export async function loadControl(supabase: SupabaseClient, now = new Date()): Promise<{ rows: ControlRow[]; counts: Record<ControlGroup, number> }> {
  const [settings, { data: shops }, { data: licenceRows }, { data: devices }, { data: drafts }] = await Promise.all([
    getPublicSettings(),
    supabase.from("businesses").select("id, name_latin, pack, created_at, banned_at, ban_reason").order("created_at", { ascending: false }).limit(MANY),
    supabase
      .from("licences")
      .select("id, business_id, plan, status, starts_at, ends_at, created_at, grace_days, gift")
      .order("created_at", { ascending: false })
      .limit(MANY),
    supabase.from("devices").select("business_id, last_seen").eq("status", "active").limit(MANY),
    supabase.from("builder_drafts").select("business_id, phone").not("business_id", "is", null).not("phone", "is", null).limit(MANY),
  ]);

  const rules = { renewalGraceDays: settings?.renewal_grace_days ?? 0 };
  const licences = latestLicences((licenceRows ?? []) as LicenceRow[]);
  const phoneOf = new Map((drafts ?? []).map((one) => [one.business_id as string, one.phone as string]));
  const computers = new Map<string, { count: number; lastSeen: string | null }>();
  for (const device of devices ?? []) {
    const known = computers.get(device.business_id as string) ?? { count: 0, lastSeen: null };
    const seen = device.last_seen as string | null;
    computers.set(device.business_id as string, {
      count: known.count + 1,
      lastSeen: seen && (!known.lastSeen || seen > known.lastSeen) ? seen : known.lastSeen,
    });
  }

  const counts = Object.fromEntries(CONTROL_GROUPS.map((group) => [group, 0])) as Record<ControlGroup, number>;
  const rows: ControlRow[] = (shops ?? []).map((shop) => {
    const licence = licences.get(shop.id as string);
    const status = shopStatus(licence, now, rules);
    const banned = shop.banned_at ? { at: shop.banned_at as string, reason: (shop.ban_reason as string | null) ?? null } : null;
    const group = controlGroupOf({ banned: Boolean(banned), status, plan: licence?.plan ?? null, gift: Boolean(licence?.gift) });
    counts[group] += 1;
    const machines = computers.get(shop.id as string);
    return {
      id: shop.id as string,
      name: shop.name_latin as string,
      pack: shop.pack as string,
      createdAt: shop.created_at as string,
      phone: phoneOf.get(shop.id as string) ?? null,
      plan: licence?.plan ?? null,
      gift: Boolean(licence?.gift),
      cancelled: licence?.grace_days === 0,
      status,
      group,
      endsAt: licence?.ends_at ?? null,
      daysLeft: daysUntil(licence?.ends_at ?? null, now),
      computers: machines?.count ?? 0,
      lastSeen: machines?.lastSeen ?? null,
      banned,
    };
  });

  return { rows, counts };
}
