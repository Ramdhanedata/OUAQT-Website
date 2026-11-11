import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { packs } from "@/app-ui/packs";
import { getPrivateSettings } from "@/builder/db/private-settings";
import { getPublicSettings, installersFor } from "@/builder/db/settings";
import { signingKeyIsSet } from "@/builder/licence/sign";
import { checkDownloads, type DownloadCheck } from "./downloads-check";
import {
  endingWithin,
  groupOf,
  latestLicences,
  liveSessions,
  presenceOf,
  shopStatus,
  SITE_LIVE_MINUTES,
  statusGroups,
  visitorsSince,
  type LicenceRow,
  type Presence,
  type StatusGroup,
} from "./overview-math";

/*
 * Everything the overview shows, read in one go on the server.
 *
 * It reads what the server holds and nothing else: shops, licences, when
 * each device last asked for its licence, payments, the builder's step
 * events and the trail. A shop's sales are not here because they never leave
 * its devices, and this file is not the place to start collecting them.
 *
 * Beside the counts it says how each service stands, for the board at the
 * top of the page: when the site, the builder and the software last gave a
 * sign of life, whether the installers are where the settings say, whether
 * licences can be signed and paid for, and how long the database took to
 * answer all of this. And the rules in force, so the price and the trial
 * length are read without opening the settings.
 *
 * Counts are worked out here from bounded reads rather than in SQL, because
 * a status depends on today's date and on the grace in settings, which is
 * the rule the software itself applies. At the scale of a few thousand shops
 * that is one quick read each; past that it wants a view.
 */

const MANY = 5_000; // not-a-rule: a ceiling on each read, far above today's shop count
const DAY = 86_400_000;
const WEEK = 7 * DAY; // not-a-rule: the overview's "last 7 days"
export const ENDING_DAYS = 7; // not-a-rule: how far ahead "ending soon" looks
const PAYMENT_NUMBERS = ["bankily_number", "masrvi_number", "bimbank_number", "sedad_number", "click_number"] as const;

export type AppRow = {
  deviceId: string;
  businessId: string;
  businessName: string;
  deviceName: string | null;
  platform: string | null;
  lastSeen: string;
};
export type Ending = { businessId: string; businessName: string; plan: string; daysLeft: number };
export type TrailEntry = { id: number; subject: string; action: string; actor: string | null; businessId: string | null; businessName: string | null; at: string };

export type Overview = {
  todo: { payments: number; review: number; codes: number; requests: number };
  /* Shops by licence state; `none` is a shop that has no licence row at all. */
  clients: { total: number; none: number } & Record<StatusGroup, number>;
  kpi: {
    newShops7: number;
    onlineApps: number;
    onlineShops: number;
    activatedApps: number;
    paying: number;
    monthAmount: number;
    monthPayments: number;
    visitorsNow: number;
    visitorsToday: number;
    /* The whole site, not only the builder: tabs, each counted once. */
    siteNow: number;
    siteToday: number;
    siteWeek: number;
    /* Presses on a download button, since counting began. */
    downloads: number;
    downloadsToday: number;
    downloadsWindows: number;
    downloadsMac: number;
  };
  /* Activated computers by how recently each checked in; the four add up to all of them. */
  presence: Record<Exclude<Presence, "never">, number>;
  platforms: { windows: number; mac: number; phone: number };
  apps: AppRow[];
  ending: Ending[];
  /* The last sign of life from each part, or null when it never gave one. */
  last: { site: string | null; builder: string | null; app: string | null };
  system: {
    signing: boolean;
    ai: { used: number; limit: number } | null;
    autoConfirm: boolean | null;
    /* How many of the payment apps have a number to pay to, and so show to owners. */
    paymentApps: number | null;
    /* Trades that have an address to download from, per system. */
    links: { windows: number; mac: number; total: number } | null;
    /* Whether a file answers at those addresses, and the version they lead to. */
    files: DownloadCheck | null;
    /* How long the database took to answer everything on this page. */
    ms: number;
  };
  /* The values owners meet first, as the settings hold them now. Amounts in the smallest unit. */
  rules: {
    trialDays: number;
    annual: number | null;
    annualLaunch: number | null;
    monthly: number | null;
    maxDevices: number;
    graceDays: number;
  } | null;
  trail: TrailEntry[];
};

export async function loadOverview(supabase: SupabaseClient, now = new Date()): Promise<Overview> {
  const since = (ms: number) => new Date(now.getTime() - ms).toISOString();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  const count = { count: "exact" as const, head: true };
  const asked = Date.now();

  const [
    publicSettings,
    privateSettings,
    { data: businesses },
    { data: licenceRows },
    { data: devices },
    { count: paymentsWaiting },
    { count: paymentsReview },
    { count: codesWaiting },
    { count: requestsNew },
    { data: monthPayments },
    { data: builderEvents },
    { data: lastBuilder },
    { data: lastVisit },
    { count: aiCalls },
    { data: trail },
    { data: siteVisits },
    { count: downloadsAll },
    { count: downloadsToday },
    { count: downloadsWindows },
    { count: downloadsMac },
  ] = await Promise.all([
    getPublicSettings(),
    getPrivateSettings(),
    supabase.from("businesses").select("id, name_latin, created_at").limit(MANY),
    supabase
      .from("licences")
      .select("id, business_id, plan, status, starts_at, ends_at, created_at, grace_days, gift")
      .order("created_at", { ascending: false })
      .limit(MANY),
    supabase
      .from("devices")
      .select("business_id, device_id, name, platform, last_seen")
      .eq("status", "active")
      .order("last_seen", { ascending: false })
      .limit(MANY),
    supabase.from("payments").select("id", count).in("status", ["submitted", "pending_confirmation"]),
    supabase.from("payments").select("id", count).eq("status", "confirmed").eq("auto_confirmed", true).is("reviewed_at", null),
    supabase.from("configuration_code_requests").select("id", count).is("handled_at", null).eq("sent", false),
    supabase.from("feature_requests").select("id", count).eq("status", "new"),
    supabase.from("payments").select("expected_amount").eq("status", "confirmed").gte("created_at", monthStart).limit(MANY),
    /* A day of a session's steps: enough for "here now" and "today". */
    supabase
      .from("builder_events")
      .select("session_hash, event, created_at")
      .gte("created_at", since(DAY))
      .order("created_at", { ascending: false })
      .limit(20_000),
    /* The last sign of life of the builder and of the site, however long ago. */
    supabase.from("builder_events").select("created_at").order("created_at", { ascending: false }).limit(1),
    supabase.from("site_events").select("created_at").eq("kind", "visit").order("created_at", { ascending: false }).limit(1),
    supabase.from("ai_calls").select("id", count).gt("created_at", since(DAY)),
    supabase
      .from("audit_events")
      .select("id, actor_id, subject, subject_id, action, detail, created_at")
      .order("created_at", { ascending: false })
      .limit(10), // not-a-rule: the latest few, for the overview
    /* A week of pages shown: enough for "here now", "today" and "these 7 days". */
    supabase
      .from("site_events")
      .select("session_hash, created_at")
      .eq("kind", "visit")
      .gte("created_at", since(WEEK))
      .order("created_at", { ascending: false })
      .limit(50_000),
    supabase.from("site_events").select("id", count).eq("kind", "download"),
    supabase.from("site_events").select("id", count).eq("kind", "download").gte("created_at", todayStart),
    supabase.from("site_events").select("id", count).eq("kind", "download").eq("platform", "windows"),
    supabase.from("site_events").select("id", count).eq("kind", "download").eq("platform", "mac"),
  ]);

  const rules = { renewalGraceDays: publicSettings?.renewal_grace_days ?? 0 };
  const names = new Map((businesses ?? []).map((one) => [one.id as string, one.name_latin as string]));
  const licences = latestLicences((licenceRows ?? []) as LicenceRow[]);

  const clients = { total: names.size, none: 0, ...Object.fromEntries(statusGroups.map((group) => [group, 0])) } as Overview["clients"];
  for (const id of names.keys()) {
    const group = groupOf(shopStatus(licences.get(id), now, rules));
    if (group) clients[group] += 1;
    else clients.none += 1;
  }

  const presence: Overview["presence"] = { now: 0, today: 0, week: 0, older: 0 };
  const platforms = { windows: 0, mac: 0, phone: 0 };
  const onlineShops = new Set<string>();
  for (const device of devices ?? []) {
    const state = presenceOf(device.last_seen, now);
    if (state !== "never") presence[state] += 1;
    if (state === "now") onlineShops.add(device.business_id);
    if (device.platform === "mac") platforms.mac += 1;
    else if (device.platform === "windows") platforms.windows += 1;
    else if (device.platform === "phone") platforms.phone += 1;
  }

  const apps: AppRow[] = (devices ?? []).slice(0, 60).map((device) => ({ // not-a-rule: the most devices one overview lists
    deviceId: device.device_id,
    businessId: device.business_id,
    businessName: names.get(device.business_id) ?? "",
    deviceName: device.name,
    platform: device.platform,
    lastSeen: device.last_seen,
  }));

  const ending: Ending[] = [];
  for (const [id, licence] of licences) {
    const left = endingWithin(licence, now, ENDING_DAYS, rules);
    if (left !== null) ending.push({ businessId: id, businessName: names.get(id) ?? "", plan: licence.plan, daysLeft: left });
  }
  ending.sort((a, b) => a.daysLeft - b.daysLeft);

  /* Everything above has answered: what follows asks other machines, not the database. */
  const ms = Date.now() - asked;

  const events = builderEvents ?? [];
  const installers = publicSettings ? packs.map((pack) => installersFor(publicSettings, pack)) : null;
  const links = installers
    ? installers.reduce(
        (sum, found) => ({ windows: sum.windows + (found.windows ? 1 : 0), mac: sum.mac + (found.mac ? 1 : 0), total: sum.total + 1 }),
        { windows: 0, mac: 0, total: 0 }
      )
    : null;
  const addresses = (installers ?? []).flatMap((found) => [found.windows, found.mac, found.macApple]).filter((one): one is string => Boolean(one));
  const files = addresses.length ? await checkDownloads(addresses).catch(() => null) : null;

  return {
    todo: {
      payments: paymentsWaiting ?? 0,
      review: paymentsReview ?? 0,
      codes: codesWaiting ?? 0,
      requests: requestsNew ?? 0,
    },
    clients,
    kpi: {
      newShops7: (businesses ?? []).filter((one) => one.created_at >= since(WEEK)).length,
      onlineApps: presence.now,
      onlineShops: onlineShops.size,
      activatedApps: (devices ?? []).length,
      paying: clients.active + clients.renewal_due,
      monthAmount: (monthPayments ?? []).reduce((sum, one) => sum + Number(one.expected_amount), 0),
      monthPayments: (monthPayments ?? []).length,
      visitorsNow: liveSessions(events, now),
      visitorsToday: new Set(events.filter((one) => one.created_at >= todayStart).map((one) => one.session_hash)).size,
      siteNow: visitorsSince(siteVisits ?? [], new Date(now.getTime() - SITE_LIVE_MINUTES * 60_000)),
      siteToday: visitorsSince(siteVisits ?? [], new Date(todayStart)),
      siteWeek: visitorsSince(siteVisits ?? [], new Date(now.getTime() - WEEK)),
      downloads: downloadsAll ?? 0,
      downloadsToday: downloadsToday ?? 0,
      downloadsWindows: downloadsWindows ?? 0,
      downloadsMac: downloadsMac ?? 0,
    },
    presence,
    platforms,
    apps,
    ending,
    last: {
      site: (lastVisit?.[0]?.created_at as string | undefined) ?? null,
      builder: (lastBuilder?.[0]?.created_at as string | undefined) ?? null,
      /* Devices arrive most recent first. */
      app: (devices?.[0]?.last_seen as string | undefined) ?? null,
    },
    system: {
      signing: signingKeyIsSet(),
      ai: privateSettings ? { used: aiCalls ?? 0, limit: privateSettings.ai_calls_per_day } : null,
      autoConfirm: privateSettings ? privateSettings.payment_auto_confirm : null,
      paymentApps: privateSettings ? PAYMENT_NUMBERS.filter((key) => privateSettings[key].trim() !== "").length : null,
      links,
      files,
      ms,
    },
    rules: publicSettings
      ? {
          trialDays: publicSettings.trial_days,
          annual: publicSettings.price_annual_standard_mru,
          annualLaunch: publicSettings.price_annual_launch_mru,
          monthly: publicSettings.price_monthly_standard_mru,
          maxDevices: publicSettings.max_devices,
          graceDays: publicSettings.renewal_grace_days,
        }
      : null,
    trail: await describeTrail(supabase, trail ?? [], names, licenceRows ?? []),
  };
}

type TrailRow = { id: number; actor_id: string | null; subject: string; subject_id: string | null; action: string; detail: unknown; created_at: string };

/*
 * The trail in words: who did it, and to which shop. A row names its
 * subject by whatever it is about, a shop, a licence or a payment, so each
 * kind is traced back to the shop it belongs to.
 */
/* The words for a trail row: the same action can mean something else about a computer than about a licence. */
export function actionWords(words: Record<string, string>, entry: { subject: string; action: string }): string {
  return words[`${entry.subject}:${entry.action}`] ?? words[entry.action] ?? entry.action.replace(/_/g, " ");
}

export async function describeTrail(
  supabase: SupabaseClient,
  rows: TrailRow[],
  names: Map<string, string>,
  licenceRows: { id?: string; business_id: string }[]
): Promise<TrailEntry[]> {
  const licenceShop = new Map(licenceRows.map((one) => [one.id, one.business_id]));
  const paymentIds = rows.filter((one) => one.subject === "payment" && one.subject_id).map((one) => one.subject_id as string);
  const actorIds = [...new Set(rows.map((one) => one.actor_id).filter((one): one is string => Boolean(one)))];

  const [{ data: payments }, { data: staff }] = await Promise.all([
    paymentIds.length ? supabase.from("payments").select("id, business_id").in("id", paymentIds) : Promise.resolve({ data: [] }),
    actorIds.length ? supabase.from("admin_users").select("user_id, name").in("user_id", actorIds) : Promise.resolve({ data: [] }),
  ]);
  const paymentShop = new Map((payments ?? []).map((one) => [one.id as string, one.business_id as string]));
  const staffNames = new Map((staff ?? []).map((one) => [one.user_id as string, (one.name as string | null) ?? null]));

  return rows.map((row) => {
    const id = row.subject_id ?? "";
    const detail = (row.detail ?? {}) as Record<string, unknown>;
    const businessId =
      (names.has(id) ? id : null) ??
      licenceShop.get(id) ??
      paymentShop.get(id) ??
      (typeof detail.business === "string" ? detail.business : null) ??
      (typeof detail.businessId === "string" ? detail.businessId : null);
    return {
      id: row.id,
      subject: row.subject,
      action: row.action,
      /* Null is the system: a payment read by the AI, a trial started by the software. */
      actor: row.actor_id ? staffNames.get(row.actor_id) ?? "" : null,
      businessId,
      businessName: businessId ? names.get(businessId) ?? null : null,
      at: row.created_at,
    };
  });
}
