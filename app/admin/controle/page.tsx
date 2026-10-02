import { Info, Search } from "lucide-react";
import Link from "next/link";
import { wordFor } from "@/builder/admin/copy";
import { growthCopy } from "@/builder/admin/copy-growth";
import { loadControl, type ControlRow } from "@/builder/admin/control";
import { ControlPanel } from "@/builder/admin/control-panel";
import { actionsFor, CONTROL_GROUPS, isControlGroup } from "@/builder/admin/control-rules";
import { adminGate } from "@/builder/admin/guard";
import { adminWords } from "@/builder/admin/language";
import { AdminNav } from "@/builder/admin/nav";
import { ago } from "@/builder/admin/overview-math";
import { matchText, phoneDigits } from "@/builder/admin/search-rules";
import { AdminSignIn } from "@/builder/admin/sign-in";
import { StatusBadge } from "@/builder/admin/status-badge";
import { adminClient } from "@/builder/db/server";
import { fill } from "@/lib/utils";

/*
 * Contrôle: every shop's software and what staff can change about it, on
 * one page. A filter per state with its count, a search by name or phone,
 * and for each shop a line that says where it stands and a panel with the
 * actions that state allows: give it for life, give a plan, extend, stop a
 * trial, cancel, suspend, reactivate, ban, unban. The filter and the search
 * are in the address, so the page reloads where it was after each action.
 */

type Props = { searchParams: Promise<{ f?: string; q?: string }> };

export default async function ControlPage(props: Props) {
  const gate = await adminGate();
  const { t, lang, locale } = await adminWords();
  if (!gate.allowed) return <AdminSignIn reason={gate.reason} />;

  const supabase = adminClient();
  if (!supabase) return <p className="text-base">{t.noDatabase}</p>;

  const c = growthCopy[lang].control;
  const params = await props.searchParams;
  const filter = isControlGroup(params.f) ? params.f : null;
  const typed = (params.q ?? "").trim().slice(0, 80);
  const now = new Date();
  const { rows, counts } = await loadControl(supabase, now);

  const digits = phoneDigits(typed);
  const shown = rows.filter(
    (row) =>
      (!filter || row.group === filter) &&
      (!typed || matchText(row.name, typed) || (digits !== null && (row.phone ?? "").includes(digits)) || row.id.startsWith(typed.toLowerCase()))
  );
  const date = (value: string) => new Date(value).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  const href = (f: string | null) => {
    const query = new URLSearchParams();
    if (f) query.set("f", f);
    if (typed) query.set("q", typed);
    const text = query.toString();
    return `/admin/controle${text ? `?${text}` : ""}`;
  };

  /* The one line that says where a shop stands, in words. */
  const lineOf = (row: ControlRow): string => {
    if (row.banned) return fill(c.line.banned, { date: date(row.banned.at) });
    if (row.group === "suspended") return c.line.suspended;
    if (row.group === "none") return c.line.none;
    if (row.plan === "perpetual") return row.gift ? c.line.lifetimeGift : c.line.lifetimePaid;
    if (row.group === "trial") return row.endsAt ? fill(c.line.trialLeft, { days: row.daysLeft ?? 0 }) : c.line.trialNotStarted;
    if (!row.endsAt) return c.line.none;
    if (row.cancelled) return fill(c.line.cancelled, { date: date(row.endsAt) });
    if (row.group === "trial_over") return fill(c.line.trialOver, { date: date(row.endsAt) });
    if (row.group === "renewal") return fill(c.line.renewal, { date: date(row.endsAt) });
    if (row.group === "expired") return fill(c.line.expired, { date: date(row.endsAt) });
    return fill(c.line.until, { date: date(row.endsAt) });
  };
  const badgeOf = (row: ControlRow) => (row.status ? wordFor(t.statuses, row.status) : c.groups.none);

  return (
    <>
      <AdminNav current="/admin/controle" staff={gate.staff.name ?? t.staffFallback} here={href(filter)} />
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">{c.title}</h1>
      <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">{c.intro}</p>
      <p className="mt-4 flex max-w-2xl gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-foreground">
        <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        {c.timing}
      </p>

      <nav aria-label={c.title} className="mt-6 flex flex-wrap gap-2">
        {[null, ...CONTROL_GROUPS].map((group) => {
          const count = group ? counts[group] : rows.length;
          if (group && count === 0 && group !== filter) return null;
          const on = group === filter;
          return (
            <Link
              key={group ?? "all"}
              href={href(group)}
              aria-current={on ? "page" : undefined}
              className={`inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 text-sm ${
                on ? "border-foreground bg-foreground text-background" : "border-border text-foreground hover:border-foreground/40"
              }`}
            >
              {group ? c.groups[group] : c.groups.all}
              <span className={`tabular-nums ${on ? "text-background/80" : "text-muted-foreground"}`}>{count}</span>
            </Link>
          );
        })}
      </nav>

      <form action="/admin/controle" className="mt-4 flex max-w-xl gap-2">
        {filter ? <input type="hidden" name="f" value={filter} /> : null}
        <label className="relative flex-1">
          <span className="sr-only">{c.search}</span>
          <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={typed}
            placeholder={c.search}
            className="min-h-[44px] w-full rounded-lg border border-border bg-surface pe-3 ps-9 text-sm text-foreground outline-none focus:border-foreground"
          />
        </label>
        <button type="submit" className="min-h-[44px] rounded-lg bg-foreground px-4 text-sm font-medium text-background">
          {c.searchButton}
        </button>
        {typed ? (
          <Link href={href(filter).replace(/([?&])q=[^&]*&?/, "$1").replace(/[?&]$/, "")} className="inline-flex min-h-[44px] items-center px-2 text-sm text-muted-foreground hover:text-foreground">
            {c.clear}
          </Link>
        ) : null}
      </form>

      {shown.length === 0 ? (
        <p className="mt-6 text-base text-muted-foreground">{c.empty}</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {shown.map((row) => (
            <li key={row.id} className={`rounded-2xl border bg-surface p-4 sm:p-5 ${row.banned ? "border-app-danger/40" : "border-border"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/clients/${row.id}`} className="text-base font-semibold text-foreground hover:underline">
                      {row.name}
                    </Link>
                    <span className="text-sm text-muted-foreground">{wordFor(t.packs, row.pack)}</span>
                  </div>
                  <p className={`mt-1 text-sm ${row.banned || row.group === "suspended" || row.cancelled ? "font-medium text-app-danger" : "text-foreground"}`}>
                    {lineOf(row)}
                  </p>
                  {row.banned?.reason ? <p className="mt-0.5 text-sm text-muted-foreground">{row.banned.reason}</p> : null}
                  <p className="mt-1 text-sm text-muted-foreground">
                    {row.computers === 0 ? c.computersNone : row.computers === 1 ? c.computersOne : fill(c.computersMany, { count: row.computers })}
                    {row.lastSeen ? ` · ${fill(c.lastSeen, { ago: ago(row.lastSeen, now, lang) })}` : ""}
                    {row.phone ? (
                      <>
                        {" · "}
                        <bdi dir="ltr">{row.phone}</bdi>
                      </>
                    ) : null}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {row.banned ? (
                    <span className="inline-flex h-7 items-center rounded-full bg-app-danger-soft px-3 text-sm font-medium text-app-danger">{c.badge.banned}</span>
                  ) : row.group === "lifetime" ? (
                    <span className="inline-flex h-7 items-center rounded-full border border-border bg-surface px-3 text-sm font-medium text-foreground">{c.badge.lifetime}</span>
                  ) : (
                    <StatusBadge status={row.status} label={badgeOf(row)} />
                  )}
                  <Link
                    href={`/admin/clients/${row.id}`}
                    className="inline-flex min-h-[40px] items-center rounded-lg px-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    {c.openClient}
                  </Link>
                </div>
              </div>
              <div className="mt-3">
                <ControlPanel t={c} businessId={row.id} actions={actionsFor({ group: row.group, plan: row.plan })} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
