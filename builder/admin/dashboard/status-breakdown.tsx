"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/*
 * Every shop by licence state: one bar for the whole, and below it one row
 * per state with its number and share. Pointing at a part of the bar lights
 * its row and says its number above the bar; pointing at a row lights its
 * part of the bar. Either opens that list of shops.
 *
 * Part-to-whole, so a stacked bar: one baseline, segments apart by a 2px
 * gap of the card's own colour, the colour always beside its words.
 */

export type Segment = { key: string; label: string; count: number; href: string; color: string };

export function StatusBreakdown({
  segments,
  total,
  totalLabel,
  locale,
}: {
  segments: Segment[];
  total: number;
  totalLabel: string;
  locale: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  const number = new Intl.NumberFormat(locale);
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
  const shown = segments.filter((one) => one.count > 0);
  const focused = segments.find((one) => one.key === active) ?? null;

  return (
    <div>
      <p className="flex items-baseline gap-2 text-sm text-muted-foreground" aria-live="polite">
        {focused ? (
          <>
            <span className="text-2xl font-semibold text-foreground">{number.format(focused.count)}</span>
            <span>
              {focused.label} · {percent.format(total ? focused.count / total : 0)}
            </span>
          </>
        ) : (
          <>
            <span className="text-2xl font-semibold text-foreground">{number.format(total)}</span>
            <span>{totalLabel}</span>
          </>
        )}
      </p>

      <div className="mt-3 flex h-3.5 gap-[2px] overflow-hidden rounded" dir="ltr">
        {shown.length === 0 ? <div className="h-full w-full bg-border" /> : null}
        {shown.map((one) => (
          <Link
            key={one.key}
            href={one.href}
            aria-label={`${one.label}: ${number.format(one.count)}`}
            onMouseEnter={() => setActive(one.key)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(one.key)}
            onBlur={() => setActive(null)}
            className="h-full min-w-[6px] transition-opacity"
            style={{
              flexGrow: one.count,
              flexBasis: 0,
              backgroundColor: one.color,
              opacity: active && active !== one.key ? 0.35 : 1,
            }}
          />
        ))}
      </div>

      <ul className="mt-4 divide-y divide-border">
        {segments.map((one) => (
          <li key={one.key}>
            <Link
              href={one.href}
              onMouseEnter={() => setActive(one.key)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(one.key)}
              onBlur={() => setActive(null)}
              className={`-mx-2 flex min-h-[44px] items-center gap-3 rounded-lg px-2 ${active === one.key ? "bg-foreground/[0.04]" : ""}`}
            >
              <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: one.color }} />
              <span className="min-w-0 flex-1 truncate text-[15px] text-foreground">{one.label}</span>
              <span className="text-[15px] font-semibold tabular-nums text-foreground">{number.format(one.count)}</span>
              <span className="w-12 text-end text-sm tabular-nums text-muted-foreground">
                {percent.format(total ? one.count / total : 0)}
              </span>
              <ChevronRight aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground rtl:rotate-180" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
