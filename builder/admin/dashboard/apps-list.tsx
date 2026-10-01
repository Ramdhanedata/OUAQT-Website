"use client";

import Link from "next/link";
import { useState } from "react";
import type { AdminLanguage } from "../copy";
import { ago, presenceOf, type Presence } from "../overview-math";

/*
 * The installed copies of the software, most recent first, and how long ago
 * each one checked in. The tabs narrow it to those online now, seen today,
 * or seen this week; each says how many it holds before it is pressed.
 *
 * The time is worked out against the moment the page was drawn, the same on
 * the server and in the browser, so the text never changes under the reader
 * between two refreshes.
 */

export type AppItem = {
  deviceId: string;
  businessId: string;
  businessName: string;
  deviceName: string | null;
  platform: string | null;
  lastSeen: string;
};

type Filter = "now" | "today" | "week" | "all";
const WITHIN: Record<Filter, Presence[]> = {
  now: ["now"],
  today: ["now", "today"],
  week: ["now", "today", "week"],
  all: ["now", "today", "week", "older"],
};
const DOT: Record<Presence, string> = {
  now: "#1f8a3a",
  today: "#6b6b68",
  week: "#a8a59c",
  older: "#d6d3ca",
  never: "#d6d3ca",
};
const SHOWN = 10; // not-a-rule: rows before "see all"

export function AppsList({
  apps,
  drawnAt,
  lang,
  words,
  allHref,
  allLabel,
}: {
  apps: AppItem[];
  drawnAt: string;
  lang: AdminLanguage;
  words: { filters: Record<Filter, string>; noApps: string };
  allHref: string;
  allLabel: string;
}) {
  const now = new Date(drawnAt);
  const withPresence = apps.map((one) => ({ ...one, presence: presenceOf(one.lastSeen, now) }));
  const counts = Object.fromEntries(
    (Object.keys(WITHIN) as Filter[]).map((one) => [one, withPresence.filter((app) => WITHIN[one].includes(app.presence)).length])
  ) as Record<Filter, number>;
  const [filter, setFilter] = useState<Filter>(counts.now > 0 ? "now" : "all");
  const shown = withPresence.filter((app) => WITHIN[filter].includes(app.presence));

  return (
    <div>
      <div role="tablist" className="flex flex-wrap gap-1 rounded-xl bg-foreground/[0.05] p-1">
        {(Object.keys(WITHIN) as Filter[]).map((one) => (
          <button
            key={one}
            type="button"
            role="tab"
            aria-selected={filter === one}
            onClick={() => setFilter(one)}
            className={`min-h-[36px] rounded-lg px-3 text-sm ${
              filter === one ? "bg-surface font-medium text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {words.filters[one]} <span className="tabular-nums">{counts[one]}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{words.noApps}</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {shown.slice(0, SHOWN).map((app) => (
            <li key={app.deviceId}>
              <Link
                href={`/admin/clients/${app.businessId}`}
                className="-mx-2 flex min-h-[52px] items-center gap-3 rounded-lg px-2 hover:bg-foreground/[0.04]"
              >
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  {app.presence === "now" ? (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ backgroundColor: DOT.now }} />
                  ) : null}
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: DOT[app.presence] }} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-foreground">{app.businessName || "?"}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {[app.deviceName, app.platform === "mac" ? "Mac" : app.platform === "windows" ? "Windows" : null].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="shrink-0 text-sm text-muted-foreground">{ago(app.lastSeen, now, lang)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {shown.length > SHOWN ? (
        <Link href={allHref} className="mt-3 inline-flex min-h-[40px] items-center text-sm font-medium text-foreground underline decoration-border underline-offset-4">
          {allLabel}
        </Link>
      ) : null}
    </div>
  );
}
