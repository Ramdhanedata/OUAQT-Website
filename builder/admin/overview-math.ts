import { daysLeft, statusOf, type LicencePlan, type LicenceRules, type LicenceStatus } from "@/app-ui/licence-status";
import type { AdminLanguage } from "./copy";

/*
 * The arithmetic behind the overview and the clients list, kept apart from
 * the queries so it can be tested without a database.
 *
 * Everything here works on what the server actually holds: licences, and
 * when each computer last asked for its licence. A shop's sales never reach
 * us, so "activity" means a computer checking in, nothing more.
 */

export type LicenceRow = {
  id?: string;
  business_id: string;
  plan: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at?: string;
  /* A licence's own grace, 0 for one staff cancelled (0031); the setting's otherwise. */
  grace_days?: number | null;
  /* Given free by staff (0031). */
  gift?: boolean | null;
};

/*
 * The newest licence of each shop, which is the one the software runs on:
 * the refresh route reads the same one. Rows must arrive newest first.
 */
export function latestLicences(rows: LicenceRow[]): Map<string, LicenceRow> {
  const out = new Map<string, LicenceRow>();
  for (const row of rows) if (!out.has(row.business_id)) out.set(row.business_id, row);
  return out;
}

/** The state a shop is in, worked out from its dates like everywhere else. */
export function shopStatus(licence: LicenceRow | undefined, now: Date, rules: LicenceRules): LicenceStatus | null {
  if (!licence) return null;
  return statusOf(
    {
      plan: licence.plan as LicencePlan,
      startsAt: licence.starts_at ? new Date(licence.starts_at) : null,
      endsAt: licence.ends_at ? new Date(licence.ends_at) : null,
      suspended: licence.status === "suspended",
    },
    now,
    { renewalGraceDays: licence.grace_days ?? rules.renewalGraceDays }
  );
}

/*
 * The groups staff filter by. An ended trial and a lapsed licence are the
 * same thing from here: a shop whose software has gone read-only.
 */
export const statusGroups = ["trial", "active", "renewal_due", "expired", "suspended"] as const;
export type StatusGroup = (typeof statusGroups)[number];

export function groupOf(status: LicenceStatus | null): StatusGroup | null {
  if (!status) return null;
  return status === "expired_trial" ? "expired" : status;
}

export function isStatusGroup(value: string | undefined): value is StatusGroup {
  return (statusGroups as readonly string[]).includes(value ?? "");
}

/*
 * How recently a computer checked in. The desktop app asks at start and then
 * every three hours while it has a network, so a computer seen in the last
 * three hours is, as near as we can know, open right now.
 */
export const CHECK_IN_HOURS = 3; // not-a-rule: the desktop app's own interval, ouaqt-desktop electron/main.ts
const HOUR = 3_600_000;

export type Presence = "now" | "today" | "week" | "older" | "never";

export function presenceOf(lastSeen: string | null | undefined, now: Date): Presence {
  if (!lastSeen) return "never";
  const age = now.getTime() - new Date(lastSeen).getTime();
  if (age <= CHECK_IN_HOURS * HOUR) return "now";
  if (age <= 24 * HOUR) return "today";
  if (age <= 7 * 24 * HOUR) return "week";
  return "older";
}

/*
 * Days until a shop's software stops, when that is within the window: a
 * trial or licence still running, or a lapsed licence in its grace. Null
 * for anything already stopped, suspended, without an end, or further off.
 */
export function endingWithin(
  licence: LicenceRow | undefined,
  now: Date,
  windowDays: number,
  rules: LicenceRules
): number | null {
  const status = shopStatus(licence, now, rules);
  if (!licence?.ends_at || (status !== "trial" && status !== "active")) return null;
  const left = daysLeft({ plan: licence.plan as LicencePlan, startsAt: null, endsAt: new Date(licence.ends_at) }, now);
  return left !== null && left <= windowDays ? left : null;
}

/* Western digits in Arabic too, as on every staff screen. */
const RELATIVE_LOCALE: Record<AdminLanguage, string> = { fr: "fr", en: "en", ar: "ar-u-nu-latn" };

/** "il y a 5 minutes", in the reader's language. */
export function ago(date: Date | string, now: Date, lang: AdminLanguage): string {
  const seconds = Math.round((new Date(date).getTime() - now.getTime()) / 1000);
  const format = new Intl.RelativeTimeFormat(RELATIVE_LOCALE[lang], { numeric: "auto" });
  const size = Math.abs(seconds);
  if (size < 60) return format.format(0, "second");
  if (size < 3_600) return format.format(Math.round(seconds / 60), "minute");
  if (size < 86_400) return format.format(Math.round(seconds / 3_600), "hour");
  if (size < 60 * 86_400) return format.format(Math.round(seconds / 86_400), "day");
  return format.format(Math.round(seconds / (30 * 86_400)), "month");
}

/*
 * Counting per day, for the activity chart. Days are UTC calendar days,
 * which in Mauritania are also the local ones. The oldest day comes first and
 * today last, with every day present, so an empty day draws as nothing
 * rather than closing the gap.
 */
export type DayCount = { day: string; count: number };

function lastDays(now: Date, days: number): string[] {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Array.from({ length: days }, (_, index) => new Date(today - (days - 1 - index) * 86_400_000).toISOString().slice(0, 10));
}

/** How many things happened each day. */
export function dailyCounts(dates: string[], now: Date, days: number): DayCount[] {
  const counts = new Map(lastDays(now, days).map((day) => [day, 0]));
  for (const date of dates) {
    const day = new Date(date).toISOString().slice(0, 10);
    if (counts.has(day)) counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return [...counts].map(([day, count]) => ({ day, count }));
}

/** How many different somebodies did something each day: a visitor counts once a day. */
export function dailyDistinct(rows: { key: string; at: string }[], now: Date, days: number): DayCount[] {
  const seen = new Map(lastDays(now, days).map((day) => [day, new Set<string>()]));
  for (const row of rows) seen.get(new Date(row.at).toISOString().slice(0, 10))?.add(row.key);
  return [...seen].map(([day, keys]) => ({ day, count: keys.size }));
}

/*
 * People in the builder right now: a session whose latest step event is
 * recent and is not the one it sends on leaving or finishing. The builder
 * reports each step as it is reached, so somebody reading a long step
 * without touching it can drop out of this count before they leave.
 */
export const LIVE_MINUTES = 30; // not-a-rule: how recent a builder step has to be to count as here now

export function liveSessions(events: { session_hash: string; event: string; created_at: string }[], now: Date): number {
  const latest = new Map<string, { event: string; at: number }>();
  for (const one of events) {
    const at = new Date(one.created_at).getTime();
    const known = latest.get(one.session_hash);
    if (!known || at >= known.at) latest.set(one.session_hash, { event: one.event, at });
  }
  const since = now.getTime() - LIVE_MINUTES * 60_000;
  return [...latest.values()].filter((one) => one.at >= since && one.event !== "left" && one.event !== "finished").length;
}

/*
 * Visitors to the site: a tab counts once however many pages it opens. A
 * page reports only when it opens, so somebody counts as here now for a
 * while after the last page they opened, reading or not.
 */
export const SITE_LIVE_MINUTES = 10; // not-a-rule: how long after opening a page a visitor counts as here now

export function visitorsSince(visits: { session_hash: string; created_at: string }[], since: Date): number {
  const from = since.getTime();
  return new Set(visits.filter((one) => new Date(one.created_at).getTime() >= from).map((one) => one.session_hash)).size;
}

/** A clean top for a chart's scale: 1, 2 or 5 times a power of ten, at least the largest value. */
export function niceMax(value: number): number {
  if (value <= 4) return Math.max(1, Math.ceil(value));
  const power = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 2, 5, 10]) if (step * power >= value) return step * power;
  return 10 * power;
}
