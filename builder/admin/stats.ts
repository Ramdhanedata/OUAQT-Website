import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicSettings } from "@/builder/db/settings";
import { groupOf, latestLicences, presenceOf, shopStatus, statusGroups, type LicenceRow, type StatusGroup } from "./overview-math";
import {
  bonusOf,
  bucketsOf,
  changeOf,
  countBoth,
  distinctBoth,
  distinctSeriesOf,
  funnelOf,
  seriesOf,
  sumBoth,
  sumSeriesOf,
  tallyOf,
  windowOf,
  type Bucket,
  type Period,
  type Trend,
} from "./stats-math";

/*
 * Everything the statistics page shows, read in one go.
 *
 * For each figure, the period asked for and the one of the same length just
 * before it; a column per day (per week over a year) for the chart; the path
 * from a visit to a paying shop; the state of what is in production now; and
 * each representative's part. Rows are read twice the period back, and in
 * full for what has no period (shops, licences, computers, payments), which
 * at OUAQT's size is a few thousand rows at most.
 */

const MANY = 100_000; // not-a-rule: a ceiling on each read, far above what a period holds

export type Figure = { current: number; previous: number; trend: Trend; percent: number | null };
export type MetricKey = "visitors" | "builder" | "serials" | "downloads" | "activations" | "shops" | "trials" | "paying" | "revenue";
export const METRICS: MetricKey[] = ["visitors", "builder", "serials", "downloads", "activations", "shops", "trials", "paying", "revenue"];

export type RepRow = {
  id: string;
  name: string;
  code: string;
  active: boolean;
  visits: number;
  serials: number;
  shops: number;
  paying: number;
  revenue: number;
  /* Since they started, whatever the period: what the bonus is worked out on. */
  allTime: { shops: number; paying: number; revenue: number; earned: number; paid: number };
};

export type Stats = {
  period: Period;
  figures: Record<MetricKey, Figure>;
  buckets: Bucket[];
  series: Record<MetricKey, number[]>;
  funnel: { key: Exclude<MetricKey, "shops" | "trials" | "revenue">; count: number; ofPrevious: number | null; ofFirst: number | null }[];
  production: {
    shops: number;
    byStatus: Record<StatusGroup | "none", number>;
    computers: number;
    online: { now: number; today: number; week: number };
    platforms: { windows: number; mac: number };
  };
  revenue: { allTime: number; payingShops: number; byPlan: [string, number][]; byApp: [string, number][]; average: number | null };
  breakdown: {
    tradesBuilt: [string, number][];
    tradesDownloaded: [string, number][];
    languages: [string, number][];
    devices: [string, number][];
    systems: [string, number][];
    pages: [string, number][];
  };
  demand: { leads: Figure; requests: Figure; leadTrades: [string, number][] };
  reps: RepRow[];
};

const figure = (both: { current: number; previous: number }): Figure => ({ ...both, ...changeOf(both.current, both.previous) });

export async function loadStats(supabase: SupabaseClient, period: Period, now = new Date()): Promise<Stats> {
  const window = windowOf(now, period);
  const back = window.previousFrom.toISOString();

  const [
    publicSettings,
    { data: visits },
    { data: downloads },
    { data: builder },
    { data: drafts },
    { data: businesses },
    { data: licenceRows },
    { data: devices },
    { data: payments },
    { data: leads },
    { data: requests },
    { data: reps },
    { data: payouts },
  ] = await Promise.all([
    getPublicSettings(),
    supabase.from("site_events").select("session_hash, page, locale, device_class, rep_code, created_at").eq("kind", "visit").gte("created_at", back).limit(MANY),
    supabase.from("site_events").select("session_hash, platform, pack, created_at").eq("kind", "download").gte("created_at", back).limit(MANY),
    supabase.from("builder_events").select("session_hash, created_at").eq("event", "reached").eq("step", 0).gte("created_at", back).limit(MANY),
    supabase.from("builder_drafts").select("pack, representative_id, serial_hash, created_at").gte("created_at", back).limit(MANY),
    supabase.from("businesses").select("id, pack, representative_id, created_at").limit(MANY),
    supabase.from("licences").select("id, business_id, plan, status, starts_at, ends_at, created_at, grace_days, gift").order("created_at", { ascending: false }).limit(MANY),
    supabase.from("devices").select("business_id, platform, status, first_seen, last_seen").limit(MANY),
    supabase.from("payments").select("business_id, plan, app, expected_amount, created_at").eq("status", "confirmed").limit(MANY),
    supabase.from("leads_other_business").select("business_type, created_at").gte("created_at", back).limit(MANY),
    supabase.from("feature_requests").select("created_at").gte("created_at", back).limit(MANY),
    supabase.from("representatives").select("id, name, code, active, commission_percent, bonus_per_client, created_at").order("created_at"),
    supabase.from("representative_payouts").select("representative_id, amount"),
  ]);

  const rules = { renewalGraceDays: publicSettings?.renewal_grace_days ?? 0 };
  const buckets = bucketsOf(now, period);
  const inPeriod = (date: string) => new Date(date).getTime() >= window.from.getTime();

  const visitRows = (visits ?? []).map((one) => ({ key: one.session_hash as string, at: one.created_at as string }));
  const builderRows = (builder ?? []).map((one) => ({ key: one.session_hash as string, at: one.created_at as string }));
  const downloadDates = (downloads ?? []).map((one) => one.created_at as string);
  const serialDates = (drafts ?? []).filter((one) => one.serial_hash).map((one) => one.created_at as string);
  const activeDevices = (devices ?? []).filter((one) => one.status === "active");
  const activationDates = (devices ?? []).map((one) => one.first_seen as string).filter(Boolean);
  const shopDates = (businesses ?? []).map((one) => one.created_at as string);
  const trialDates = (licenceRows ?? []).filter((one) => one.plan === "trial" && one.starts_at).map((one) => one.starts_at as string);
  const paymentRows = (payments ?? []).map((one) => ({ amount: Number(one.expected_amount), at: one.created_at as string, business: one.business_id as string }));

  /* A shop becomes a paying shop on its first confirmed payment. */
  const firstPaid = new Map<string, string>();
  for (const one of [...paymentRows].sort((a, b) => a.at.localeCompare(b.at))) if (!firstPaid.has(one.business)) firstPaid.set(one.business, one.at);
  const payingDates = [...firstPaid.values()];

  const figures: Record<MetricKey, Figure> = {
    visitors: figure(distinctBoth(visitRows, window)),
    builder: figure(distinctBoth(builderRows, window)),
    serials: figure(countBoth(serialDates, window)),
    downloads: figure(countBoth(downloadDates, window)),
    activations: figure(countBoth(activationDates, window)),
    shops: figure(countBoth(shopDates, window)),
    trials: figure(countBoth(trialDates, window)),
    paying: figure(countBoth(payingDates, window)),
    revenue: figure(sumBoth(paymentRows, window)),
  };

  const series: Record<MetricKey, number[]> = {
    visitors: distinctSeriesOf(visitRows, buckets),
    builder: distinctSeriesOf(builderRows, buckets),
    serials: seriesOf(serialDates, buckets),
    downloads: seriesOf(downloadDates, buckets),
    activations: seriesOf(activationDates, buckets),
    shops: seriesOf(shopDates, buckets),
    trials: seriesOf(trialDates, buckets),
    paying: seriesOf(payingDates, buckets),
    revenue: sumSeriesOf(paymentRows, buckets),
  };

  /*
   * The funnel counts people, so its downloads are the visitors who pressed a
   * download, once each, not the presses: one owner downloading twice is still
   * one owner further along.
   */
  const downloaders = distinctBoth((downloads ?? []).map((one) => ({ key: one.session_hash as string, at: one.created_at as string })), window).current;
  const funnelKeys = ["visitors", "builder", "serials", "downloads", "activations", "paying"] as const;
  const funnel = funnelOf(funnelKeys.map((key) => (key === "downloads" ? downloaders : figures[key].current))).map((step, index) => ({
    key: funnelKeys[index],
    ...step,
  }));

  /* In production now: whatever the period. */
  const licences = latestLicences((licenceRows ?? []) as LicenceRow[]);
  const byStatus = { none: 0, ...Object.fromEntries(statusGroups.map((group) => [group, 0])) } as Stats["production"]["byStatus"];
  for (const shop of businesses ?? []) {
    const group = groupOf(shopStatus(licences.get(shop.id as string), now, rules));
    byStatus[group ?? "none"] += 1;
  }
  const online = { now: 0, today: 0, week: 0 };
  for (const device of activeDevices) {
    const presence = presenceOf(device.last_seen as string | null, now);
    if (presence === "now") online.now += 1;
    if (presence === "now" || presence === "today") online.today += 1;
    if (presence !== "older" && presence !== "never") online.week += 1;
  }

  const periodPayments = (payments ?? []).filter((one) => inPeriod(one.created_at as string));
  const sumBy = (rows: typeof periodPayments, key: "plan" | "app") => {
    const totals = new Map<string, number>();
    for (const one of rows) totals.set((one[key] as string) ?? "", (totals.get((one[key] as string) ?? "") ?? 0) + Number(one.expected_amount));
    return [...totals].sort((a, b) => b[1] - a[1]);
  };
  const allTimeRevenue = paymentRows.reduce((sum, one) => sum + one.amount, 0);

  const periodVisits = (visits ?? []).filter((one) => inPeriod(one.created_at as string));
  /* A visitor's language and device once, their pages each time. */
  const firstOfEach = new Map<string, (typeof periodVisits)[number]>();
  for (const one of periodVisits) if (!firstOfEach.has(one.session_hash as string)) firstOfEach.set(one.session_hash as string, one);
  const periodDownloads = (downloads ?? []).filter((one) => inPeriod(one.created_at as string));
  const periodLeads = (leads ?? []).filter((one) => inPeriod(one.created_at as string));

  /* Each representative: the period, and since the beginning for the bonus. */
  const shopRep = new Map((businesses ?? []).map((one) => [one.id as string, one.representative_id as string | null]));
  const paidOut = new Map<string, number>();
  for (const one of payouts ?? []) paidOut.set(one.representative_id as string, (paidOut.get(one.representative_id as string) ?? 0) + Number(one.amount));
  const repRows: RepRow[] = (reps ?? []).map((rep) => {
    const mine = (businessId: string) => shopRep.get(businessId) === rep.id;
    const theirShops = (businesses ?? []).filter((one) => one.representative_id === rep.id);
    const theirPayments = paymentRows.filter((one) => mine(one.business));
    const payingAll = new Set(theirPayments.map((one) => one.business)).size;
    const revenueAll = theirPayments.reduce((sum, one) => sum + one.amount, 0);
    return {
      id: rep.id as string,
      name: rep.name as string,
      code: rep.code as string,
      active: Boolean(rep.active),
      visits: new Set(periodVisits.filter((one) => one.rep_code === rep.code).map((one) => one.session_hash as string)).size,
      serials: (drafts ?? []).filter((one) => one.representative_id === rep.id && one.serial_hash && inPeriod(one.created_at as string)).length,
      shops: theirShops.filter((one) => inPeriod(one.created_at as string)).length,
      paying: [...firstPaid].filter(([business, date]) => mine(business) && inPeriod(date)).length,
      revenue: theirPayments.filter((one) => inPeriod(one.at)).reduce((sum, one) => sum + one.amount, 0),
      allTime: {
        shops: theirShops.length,
        paying: payingAll,
        revenue: revenueAll,
        earned: bonusOf({ revenue: revenueAll, payingShops: payingAll, percent: Number(rep.commission_percent), perShop: Number(rep.bonus_per_client) }),
        paid: paidOut.get(rep.id as string) ?? 0,
      },
    };
  });

  return {
    period,
    figures,
    buckets,
    series,
    funnel,
    production: {
      shops: (businesses ?? []).length,
      byStatus,
      computers: activeDevices.length,
      online,
      platforms: {
        windows: activeDevices.filter((one) => one.platform === "windows").length,
        mac: activeDevices.filter((one) => one.platform === "mac").length,
      },
    },
    revenue: {
      allTime: allTimeRevenue,
      payingShops: firstPaid.size,
      byPlan: sumBy(periodPayments, "plan"),
      byApp: sumBy(periodPayments, "app"),
      average: periodPayments.length ? Math.round(figures.revenue.current / periodPayments.length) : null,
    },
    breakdown: {
      tradesBuilt: tallyOf((drafts ?? []).filter((one) => one.serial_hash && inPeriod(one.created_at as string)).map((one) => one.pack as string), ""),
      tradesDownloaded: tallyOf(periodDownloads.map((one) => one.pack as string), ""),
      languages: tallyOf([...firstOfEach.values()].map((one) => one.locale as string), ""),
      devices: tallyOf([...firstOfEach.values()].map((one) => one.device_class as string), ""),
      systems: tallyOf(periodDownloads.map((one) => one.platform as string), ""),
      pages: tallyOf(periodVisits.map((one) => one.page as string), "").slice(0, 10),
    },
    demand: {
      leads: figure(countBoth((leads ?? []).map((one) => one.created_at as string), window)),
      requests: figure(countBoth((requests ?? []).map((one) => one.created_at as string), window)),
      leadTrades: tallyOf(periodLeads.map((one) => one.business_type as string), "").slice(0, 8),
    },
    reps: repRows,
  };
}
