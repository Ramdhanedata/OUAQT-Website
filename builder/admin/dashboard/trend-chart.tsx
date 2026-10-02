"use client";

import { useState } from "react";
import { formatMoney } from "@/app-ui";
import type { AppLanguage } from "@/app-ui/config";
import { fill } from "@/lib/utils";
import { niceMax } from "../overview-math";
import type { Bucket } from "../stats-math";

/*
 * The statistics page's chart: any one figure over the chosen period, picked
 * above the chart, a column per day (per week over a year). Built like the
 * overview's chart: one colour, one scale, columns from a baseline, each
 * column its own target that says its date and value, and a table behind it
 * for a screen reader.
 */

const BAR = "#2a78d6";
const BAR_ACTIVE = "#1c5cab";

/* `total` is the figure for the whole period, when adding the columns would count someone twice (a visitor on two days). */
export type TrendMetric = { key: string; label: string; values: number[]; total?: number; money?: boolean };

export function TrendChart({
  metrics,
  buckets,
  words,
  locale,
  language,
}: {
  metrics: TrendMetric[];
  buckets: Bucket[];
  words: { total: string; week: string; empty: string };
  locale: string;
  language: AppLanguage;
}) {
  const [key, setKey] = useState(metrics[0]?.key);
  const [hovered, setHovered] = useState<number | null>(null);
  const metric = metrics.find((one) => one.key === key) ?? metrics[0];
  if (!metric) return null;

  const values = metric.values;
  const total = metric.total ?? values.reduce((sum, one) => sum + one, 0);
  const top = niceMax(Math.max(...values, 0));
  const number = new Intl.NumberFormat(locale);
  const show = (value: number) => (metric.money ? formatMoney(value, language) : number.format(value));
  const weekly = (buckets[0]?.days ?? 1) > 1;
  const date = (day: string, long: boolean) =>
    new Date(`${day}T12:00:00Z`).toLocaleDateString(locale, {
      ...(long && !weekly ? { weekday: "long" } : {}),
      day: "numeric",
      month: long ? "long" : "short",
      timeZone: "UTC",
    });
  const label = (index: number, long: boolean) =>
    weekly ? fill(words.week, { date: date(buckets[index].start, long) }) : date(buckets[index].start, long);

  const pill = (on: boolean) =>
    `min-h-[36px] rounded-lg px-3 text-sm ${on ? "bg-surface font-medium text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`;

  return (
    <div>
      <div role="group" className="flex flex-wrap gap-1 rounded-xl bg-foreground/[0.05] p-1">
        {metrics.map((one) => (
          <button key={one.key} type="button" aria-pressed={one.key === metric.key} onClick={() => setKey(one.key)} className={pill(one.key === metric.key)}>
            {one.label}
          </button>
        ))}
      </div>

      <p className="mt-5 flex flex-wrap items-baseline gap-x-2" aria-live="polite">
        <span className="text-3xl font-semibold tracking-tight text-foreground">
          <bdi dir="ltr">{show(hovered !== null ? values[hovered] : total)}</bdi>
        </span>
        <span className="text-sm text-muted-foreground">{hovered !== null ? label(hovered, true) : `${metric.label} · ${words.total}`}</span>
      </p>

      <div className="mt-4 flex gap-3" dir="ltr">
        <div className="flex h-48 flex-col justify-between text-end text-xs tabular-nums text-muted-foreground" aria-hidden>
          <span>{metric.money ? number.format(top / 100) : number.format(top)}</span>
          <span>{metric.money ? number.format(top / 200) : number.format(top / 2)}</span>
          <span>0</span>
        </div>
        <div className="relative h-48 flex-1">
          <div aria-hidden className="absolute inset-0 flex flex-col justify-between">
            <div className="border-t border-border" />
            <div className="border-t border-border" />
            <div className="border-t border-foreground/20" />
          </div>
          <div className="absolute inset-0 flex items-end justify-between gap-[2px]">
            {values.map((value, index) => (
              <button
                key={buckets[index].start}
                type="button"
                aria-label={`${label(index, true)}: ${show(value)}`}
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(index)}
                onBlur={() => setHovered(null)}
                className="group relative flex h-full flex-1 items-end justify-center outline-none"
              >
                <span
                  className="block w-full max-w-[24px] rounded-t-[4px] transition-colors"
                  style={{ height: value ? `max(${(value / top) * 100}%, 3px)` : 0, backgroundColor: hovered === index ? BAR_ACTIVE : BAR }}
                />
                {hovered === index ? (
                  <span className="pointer-events-none absolute -top-2 z-10 -translate-y-full whitespace-nowrap rounded-lg border border-border bg-surface px-2.5 py-1.5 text-start shadow-md">
                    <span className="block text-sm font-semibold text-foreground">{show(value)}</span>
                    <span className="block text-xs text-muted-foreground">{label(index, false)}</span>
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 flex justify-between ps-9 text-xs text-muted-foreground" dir="ltr" aria-hidden>
        <span>{label(0, false)}</span>
        <span>{label(Math.floor(buckets.length / 2), false)}</span>
        <span>{label(buckets.length - 1, false)}</span>
      </div>
      {total === 0 ? <p className="mt-3 text-sm text-muted-foreground">{words.empty}</p> : null}

      <table className="sr-only">
        <caption>{metric.label}</caption>
        <tbody>
          {values.map((value, index) => (
            <tr key={buckets[index].start}>
              <th scope="row">{label(index, true)}</th>
              <td>{show(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
