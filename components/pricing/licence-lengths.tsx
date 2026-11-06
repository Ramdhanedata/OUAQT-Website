"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/*
 * The licence, priced for each length an owner can pay for: a month, two,
 * three, six, or a year (Adel, 2026-11-06). He picks a length and sees what
 * it costs, and what that comes to a month.
 *
 * Every figure is worked out and formatted on the server, from settings, and
 * every length is in the page: the ones not picked are only hidden, so the
 * page reads in full without JavaScript and to anything that indexes it. A
 * length whose price nobody has set says its price is coming.
 */

export type LengthOption = {
  plan: string;
  /* "6 mois" */
  label: string;
  /* "Tous les 6 mois" */
  cadence: string;
  /* Formatted, or null when the price is not set yet. */
  current: string | null;
  /* The standard price struck beside a launch price, formatted. */
  struck: string | null;
  /* "soit 1 250 MRU par mois", or null for a single month or no price. */
  monthly: string | null;
};

export function LicenceLengths({
  options,
  label,
  note,
  choose,
  soon,
  labels,
  dir,
}: {
  /* Longest first: the year is what is shown before anything is picked. */
  options: LengthOption[];
  label: string;
  note: string;
  choose: string;
  soon: string;
  labels: { standard: string; launch: string };
  dir: "ltr" | "rtl";
}) {
  const [picked, setPicked] = useState(options[0]?.plan ?? null);

  return (
    <div className="px-6 py-6 sm:px-8">
      <span className="block text-base font-medium tracking-tight text-foreground">{label}</span>
      <span className="mt-1 block max-w-xl text-sm leading-relaxed text-muted-foreground">{note}</span>

      <div
        role="group"
        aria-label={choose}
        /* Three to a row on a phone, where five do not fit; one row from there up. */
        className="mt-5 grid grid-cols-3 gap-1 rounded-2xl border border-border bg-background p-1 sm:inline-flex sm:max-w-full sm:flex-wrap"
      >
        {options.map((one) => (
          <button
            key={one.plan}
            type="button"
            aria-pressed={one.plan === picked}
            onClick={() => setPicked(one.plan)}
            className={cn(
              "min-h-[44px] rounded-xl px-3 text-sm font-medium transition-colors sm:px-4",
              one.plan === picked
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {one.label}
          </button>
        ))}
      </div>

      {options.map((one) => (
        <div
          key={one.plan}
          hidden={one.plan !== picked}
          /* The class too: a display utility would otherwise win over the attribute. */
          className={cn(
            "mt-6 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-8",
            one.plan === picked ? "flex" : "hidden"
          )}
        >
          <div>
            <span className="block text-sm text-muted-foreground">{one.cadence}</span>
            {one.monthly ? (
              <span className="mt-1 block text-sm text-muted-foreground">{one.monthly}</span>
            ) : null}
          </div>
          <div className="shrink-0 sm:text-end" aria-live="polite">
            {one.current === null ? (
              <span className="text-base text-muted-foreground">{soon}</span>
            ) : (
              <span className="inline-flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {one.struck !== null ? (
                  <>
                    <span className="sr-only">{labels.standard}</span>
                    <s className="text-lg text-muted-foreground decoration-accent/80">
                      <bdi dir={dir}>{one.struck}</bdi>
                    </s>
                    <span className="sr-only">{labels.launch}</span>
                  </>
                ) : null}
                <span className="text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
                  <bdi dir={dir}>{one.current}</bdi>
                </span>
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
