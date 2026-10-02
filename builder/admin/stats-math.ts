/*
 * The arithmetic behind the statistics page and the representatives, kept
 * apart from the database so every rule here is tested on its own.
 *
 * A period is the last N days up to now, and every figure is compared with
 * the N days just before it, so a rise or a fall is always against a stretch
 * of the same length.
 */

export const PERIODS = [7, 30, 90, 365] as const;
export type Period = (typeof PERIODS)[number];
export const DEFAULT_PERIOD: Period = 30;

const DAY = 86_400_000;
/* Up to this many days the chart shows days; beyond it, weeks. */
const DAILY_UP_TO = 90; // not-a-rule: a year of days is too many columns to read
const WEEK_DAYS = 7;

export function periodOf(value: string | string[] | undefined): Period {
  const number = Number(Array.isArray(value) ? value[0] : value);
  return (PERIODS as readonly number[]).includes(number) ? (number as Period) : DEFAULT_PERIOD;
}

export type Window = { from: Date; to: Date; previousFrom: Date };

export function windowOf(now: Date, days: number): Window {
  return {
    from: new Date(now.getTime() - days * DAY),
    to: now,
    previousFrom: new Date(now.getTime() - 2 * days * DAY),
  };
}

const at = (value: string) => new Date(value).getTime();
const inCurrent = (value: string, window: Window) => at(value) >= window.from.getTime() && at(value) <= window.to.getTime();
const inPrevious = (value: string, window: Window) => at(value) >= window.previousFrom.getTime() && at(value) < window.from.getTime();

/* This period and the one before it, for anything with a date. */
export function countBoth(dates: string[], window: Window): { current: number; previous: number } {
  let current = 0;
  let previous = 0;
  for (const date of dates) {
    if (inCurrent(date, window)) current += 1;
    else if (inPrevious(date, window)) previous += 1;
  }
  return { current, previous };
}

/* The same, counting each key once per period: a visitor reading five pages is one visitor. */
export function distinctBoth(rows: { key: string; at: string }[], window: Window): { current: number; previous: number } {
  const current = new Set<string>();
  const previous = new Set<string>();
  for (const row of rows) {
    if (inCurrent(row.at, window)) current.add(row.key);
    else if (inPrevious(row.at, window)) previous.add(row.key);
  }
  return { current: current.size, previous: previous.size };
}

export function sumBoth(rows: { amount: number; at: string }[], window: Window): { current: number; previous: number } {
  let current = 0;
  let previous = 0;
  for (const row of rows) {
    if (inCurrent(row.at, window)) current += row.amount;
    else if (inPrevious(row.at, window)) previous += row.amount;
  }
  return { current, previous };
}

export type Trend = "up" | "down" | "flat" | "new";

/*
 * How a figure moved. A percentage needs something to compare with: from
 * nothing to something is "new", not an infinite rise.
 */
export function changeOf(current: number, previous: number): { trend: Trend; percent: number | null } {
  if (previous === 0) return current === 0 ? { trend: "flat", percent: null } : { trend: "new", percent: null };
  const percent = Math.round(((current - previous) / previous) * 100);
  return { trend: percent > 0 ? "up" : percent < 0 ? "down" : "flat", percent };
}

/* The chart's columns: days for a short period, weeks (seven days, ending today) for a year. */
export type Bucket = { start: string; days: number };

export function bucketsOf(now: Date, days: number): Bucket[] {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const step = days > DAILY_UP_TO ? WEEK_DAYS : 1;
  const count = Math.ceil(days / step);
  const buckets: Bucket[] = [];
  for (let index = count - 1; index >= 0; index -= 1) {
    const start = today - (index * step + (step - 1)) * DAY;
    buckets.push({ start: new Date(start).toISOString().slice(0, 10), days: step });
  }
  return buckets;
}

function bucketIndex(buckets: Bucket[], value: string): number {
  const time = at(value);
  for (let index = buckets.length - 1; index >= 0; index -= 1) {
    const start = at(`${buckets[index].start}T00:00:00Z`);
    if (time >= start && time < start + buckets[index].days * DAY) return index;
  }
  return -1;
}

export function seriesOf(dates: string[], buckets: Bucket[]): number[] {
  const values = buckets.map(() => 0);
  for (const date of dates) {
    const index = bucketIndex(buckets, date);
    if (index >= 0) values[index] += 1;
  }
  return values;
}

export function distinctSeriesOf(rows: { key: string; at: string }[], buckets: Bucket[]): number[] {
  const sets = buckets.map(() => new Set<string>());
  for (const row of rows) {
    const index = bucketIndex(buckets, row.at);
    if (index >= 0) sets[index].add(row.key);
  }
  return sets.map((set) => set.size);
}

export function sumSeriesOf(rows: { amount: number; at: string }[], buckets: Bucket[]): number[] {
  const values = buckets.map(() => 0);
  for (const row of rows) {
    const index = bucketIndex(buckets, row.at);
    if (index >= 0) values[index] += row.amount;
  }
  return values;
}

/* A funnel's steps, each with its share of the step before and of the first. */
export function funnelOf(counts: number[]): { count: number; ofPrevious: number | null; ofFirst: number | null }[] {
  return counts.map((count, index) => ({
    count,
    ofPrevious: index === 0 || counts[index - 1] === 0 ? null : count / counts[index - 1],
    ofFirst: index === 0 || counts[0] === 0 ? null : count / counts[0],
  }));
}

/* How many of each, most first: trades, languages, pages. */
export function tallyOf(keys: (string | null | undefined)[], none: string): [string, number][] {
  const counts = new Map<string, number>();
  for (const key of keys) counts.set(key || none, (counts.get(key || none) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/*
 * A representative's bonus, in the same minor units as the payments: their
 * share of what their shops paid, and a fixed amount for each shop that paid.
 */
export function bonusOf(input: { revenue: number; payingShops: number; percent: number; perShop: number }): number {
  return Math.round((input.revenue * input.percent) / 100) + input.perShop * input.payingShops;
}
