"use client";

import { useState } from "react";
import { fill } from "@/lib/utils";
import { niceMax, type DayCount } from "../overview-math";

/*
 * What happened each day: new customers, people in the builder, computers
 * activated. One series at a time, picked above the chart with the range,
 * so there is one colour and one scale and nothing to decode.
 *
 * Columns from one baseline, at most 24px wide with a 2px gap, rounded only
 * at their tip. Each day is its own target, the whole height of the chart,
 * and says its date and number when pointed at or focused. A table with
 * every value sits behind it for a screen reader.
 */

type SeriesKey = "shops" | "visitors" | "activations";
const RANGES = [7, 30] as const;
const BAR = "#2a78d6";
const BAR_ACTIVE = "#1c5cab";

export function ActivityChart({
  series,
  words,
  locale,
}: {
  series: Record<SeriesKey, DayCount[]>;
  words: { series: Record<SeriesKey, string>; range: { d7: string; d30: string }; periodTotal: string; chartEmpty: string };
  locale: string;
}) {
  const [key, setKey] = useState<SeriesKey>("shops");
  const [range, setRange] = useState<(typeof RANGES)[number]>(30);
  const [hovered, setHovered] = useState<number | null>(null);

  const data = series[key].slice(-range);
  const total = data.reduce((sum, one) => sum + one.count, 0);
  const top = niceMax(Math.max(...data.map((one) => one.count), 0));
  const number = new Intl.NumberFormat(locale);
  const shortDay = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString(locale, { day: "numeric", month: "short", timeZone: "UTC" });
  const longDay = (day: string) =>
    new Date(`${day}T12:00:00Z`).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

  const pill = (on: boolean) =>
    `min-h-[36px] rounded-lg px-3 text-sm ${on ? "bg-surface font-medium text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" className="flex flex-wrap gap-1 rounded-xl bg-foreground/[0.05] p-1">
          {(Object.keys(words.series) as SeriesKey[]).map((one) => (
            <button key={one} type="button" aria-pressed={key === one} onClick={() => setKey(one)} className={pill(key === one)}>
              {words.series[one]}
            </button>
          ))}
        </div>
        <div role="group" className="flex gap-1 rounded-xl bg-foreground/[0.05] p-1">
          {RANGES.map((one) => (
            <button key={one} type="button" aria-pressed={range === one} onClick={() => setRange(one)} className={pill(range === one)}>
              {one === 7 ? words.range.d7 : words.range.d30}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-5 flex items-baseline gap-2" aria-live="polite">
        <span className="text-3xl font-semibold tracking-tight text-foreground">
          {number.format(hovered !== null ? data[hovered].count : total)}
        </span>
        <span className="text-sm text-muted-foreground">
          {hovered !== null ? longDay(data[hovered].day) : `${words.series[key]} · ${fill(words.periodTotal, { days: range })}`}
        </span>
      </p>

      <div className="mt-4 flex gap-3" dir="ltr">
        <div className="flex h-44 flex-col justify-between text-end text-xs tabular-nums text-muted-foreground" aria-hidden>
          <span>{number.format(top)}</span>
          <span>{number.format(top / 2)}</span>
          <span>0</span>
        </div>
        <div className="relative h-44 flex-1">
          <div aria-hidden className="absolute inset-0 flex flex-col justify-between">
            <div className="border-t border-border" />
            <div className="border-t border-border" />
            <div className="border-t border-foreground/20" />
          </div>
          <div className="absolute inset-0 flex items-end justify-between gap-[2px]">
            {data.map((one, index) => (
              <button
                key={one.day}
                type="button"
                aria-label={`${longDay(one.day)}: ${number.format(one.count)}`}
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(index)}
                onBlur={() => setHovered(null)}
                className="group relative flex h-full flex-1 items-end justify-center outline-none"
              >
                <span
                  className="block w-full max-w-[24px] rounded-t-[4px] transition-colors"
                  style={{
                    height: one.count ? `max(${(one.count / top) * 100}%, 3px)` : 0,
                    backgroundColor: hovered === index ? BAR_ACTIVE : BAR,
                  }}
                />
                {hovered === index ? (
                  <span className="pointer-events-none absolute -top-2 z-10 -translate-y-full whitespace-nowrap rounded-lg border border-border bg-surface px-2.5 py-1.5 text-start shadow-md">
                    <span className="block text-sm font-semibold text-foreground">{number.format(one.count)}</span>
                    <span className="block text-xs text-muted-foreground">{shortDay(one.day)}</span>
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 flex justify-between ps-9 text-xs text-muted-foreground" dir="ltr" aria-hidden>
        <span>{shortDay(data[0].day)}</span>
        <span>{shortDay(data[Math.floor(data.length / 2)].day)}</span>
        <span>{shortDay(data[data.length - 1].day)}</span>
      </div>
      {total === 0 ? <p className="mt-3 text-sm text-muted-foreground">{words.chartEmpty}</p> : null}

      <table className="sr-only">
        <caption>{words.series[key]}</caption>
        <tbody>
          {data.map((one) => (
            <tr key={one.day}>
              <th scope="row">{longDay(one.day)}</th>
              <td>{one.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
