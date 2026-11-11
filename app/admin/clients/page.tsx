import Link from "next/link";
import { wordFor } from "@/builder/admin/copy";
import { growthCopy } from "@/builder/admin/copy-growth";
import { loadControl, type ControlRow } from "@/builder/admin/control";
import { ControlPanel } from "@/builder/admin/control-panel";
import { actionsFor, CONTROL_GROUPS, isControlGroup, type ControlGroup } from "@/builder/admin/control-rules";
import { adminGate } from "@/builder/admin/guard";
import { adminWords } from "@/builder/admin/language";
import { LiveRefresh } from "@/builder/admin/live";
import { AdminNav } from "@/builder/admin/nav";
import { ago, groupOf, isStatusGroup, type StatusGroup } from "@/builder/admin/overview-math";
import { findShops } from "@/builder/admin/search";
import { AdminSignIn } from "@/builder/admin/sign-in";
import { StatusBadge } from "@/builder/admin/status-badge";
import { adminClient } from "@/builder/db/server";
import { fill } from "@/lib/utils";

/*
 * Every client, finding one, and deciding about one, on a single page.
 *
 * It used to be two: a list to search, and "Contrôle", the same shops over
 * again with their buttons. Now each shop is one card that says where it
 * stands in words and opens the actions that state allows: give it for
 * life, give a plan, extend, stop a trial, cancel, suspend, reactivate, ban,
 * unban. Its own page, one click further, holds the rest.
 *
 * Found by whatever the person on the phone has in front of them: the shop's
 * name, the owner's phone, the numéro de série, the code on the device's
 * screen or the address. The search box above every admin page brings its
 * words here; builder/admin/search.ts says how each kind is matched.
 *
 * The filter and the search are in the address, so the page reloads where it
 * was after each action. `f` is one of this page's own states; `statut` is
 * the coarser group the overview and the statistics count by, kept so their
 * figures open exactly the shops they counted.
 */

const SHOWN = 200; // not-a-rule: cards drawn at once; a search or a filter narrows the rest

type Props = { searchParams: Promise<{ q?: string; f?: string; statut?: string }> };

export default async function ClientsPage(props: Props) {
  const gate = await adminGate();
  const { lang, t, locale } = await adminWords();
  if (!gate.allowed) return <AdminSignIn reason={gate.reason} />;

  const supabase = adminClient();
  if (!supabase) return <p className="text-base">{t.noDatabase}</p>;

  const c = growthCopy[lang].control;
  const params = await props.searchParams;
  const query = (params.q ?? "").trim().slice(0, 80);
  const state: ControlGroup | null = isControlGroup(params.f) ? params.f : null;
  const coarse: StatusGroup | null = !state && isStatusGroup(params.statut) ? params.statut : null;
  const now = new Date();

  const [{ rows: every }, found] = await Promise.all([loadControl(supabase, now), query ? findShops(supabase, query) : null]);
  const matchedBy = found ? new Map(found.map((one) => [one.shop.id, one.matched])) : null;
  const rows = matchedBy ? every.filter((row) => matchedBy.has(row.id)) : every;
  const counts = Object.fromEntries(CONTROL_GROUPS.map((group) => [group, rows.filter((row) => row.group === group).length])) as Record<ControlGroup, number>;
  const matching = rows.filter((row) => (!state || row.group === state) && (!coarse || groupOf(row.status) === coarse));
  const shown = matching.slice(0, SHOWN);

  const date = (value: string) => new Date(value).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  const href = (next: { f?: ControlGroup | null; q?: string }) => {
    const search = new URLSearchParams();
    const q = next.q ?? query;
    if (q) search.set("q", q);
    if (next.f) search.set("f", next.f);
    const text = search.toString();
    return `/admin/clients${text ? `?${text}` : ""}`;
  };
  const here = (() => {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    if (state) search.set("f", state);
    if (coarse) search.set("statut", coarse);
    const text = search.toString();
    return `/admin/clients${text ? `?${text}` : ""}`;
  })();

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
      <AdminNav current="/admin/clients" staff={gate.staff.name ?? t.staffFallback} here={here} />
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{t.clients.title}</h1>
        <LiveRefresh drawnAt={now.toISOString()} words={{ live: t.overview.live, refresh: t.overview.refresh }} locale={locale} />
      </div>

      {query ? (
        <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {fill(t.clients.searchingFor, { query })}
          <Link href={href({ f: state, q: "" })} className="rounded-full border border-border px-3 py-1 text-foreground hover:border-foreground">
            {t.clients.clearSearch}
          </Link>
        </p>
      ) : null}

      <nav aria-label={t.clients.title} className="mt-4 flex flex-wrap gap-2">
        <Chip href={href({ f: null })} on={!state && !coarse} label={c.groups.all} count={rows.length} />
        {/* A figure on the overview that brought the reader here: its own words, and one press to drop it. */}
        {coarse ? <Chip href={href({ f: null })} on label={t.overview.tiles[coarse]} count={matching.length} /> : null}
        {CONTROL_GROUPS.map((group) =>
          counts[group] === 0 && group !== state ? null : (
            <Chip key={group} href={href({ f: state === group ? null : group })} on={group === state} label={c.groups[group]} count={counts[group]} />
          )
        )}
      </nav>

      {shown.length === 0 ? (
        <p className="mt-6 text-base text-muted-foreground">{query || state || coarse ? t.clients.nothingFound : t.clients.none}</p>
      ) : (
        <>
          {matching.length > shown.length ? (
            <p className="mt-4 text-sm text-muted-foreground">{fill(t.clients.shown, { shown: shown.length, total: matching.length })}</p>
          ) : null}
          <ul className="mt-4 space-y-3">
            {shown.map((row) => {
              const matched = matchedBy?.get(row.id);
              return (
                <li key={row.id} className={`rounded-2xl border bg-surface p-4 sm:p-5 ${row.banned ? "border-app-danger/40" : "border-border"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Link href={`/admin/clients/${row.id}`} className="text-base font-semibold text-foreground hover:underline">
                          {row.name}
                        </Link>
                        {row.nameArabic ? (
                          <bdi dir="rtl" lang="ar" className="text-base text-muted-foreground">
                            {row.nameArabic}
                          </bdi>
                        ) : null}
                        <span className="text-sm text-muted-foreground">
                          {wordFor(t.packs, row.pack)}
                          {row.launch ? ` · ${t.clients.launch}` : ""}
                        </span>
                      </div>
                      <p className={`mt-1 text-sm ${row.banned || row.group === "suspended" || row.cancelled ? "font-medium text-app-danger" : "text-foreground"}`}>
                        {lineOf(row)}
                      </p>
                      {row.banned?.reason ? <p className="mt-0.5 text-sm text-muted-foreground">{row.banned.reason}</p> : null}
                      <p className="mt-1 text-sm text-muted-foreground">
                        {matched && matched !== "name" ? `${fill(t.search.by, { what: t.search.matched[matched] ?? matched })} · ` : ""}
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
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}

function Chip({ href, on, label, count }: { href: string; on: boolean; label: string; count: number }) {
  return (
    <Link
      href={href}
      aria-current={on ? "page" : undefined}
      className={`inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 text-sm ${
        on ? "border-foreground bg-foreground text-background" : "border-border text-foreground hover:border-foreground/40"
      }`}
    >
      {label}
      <span className={`tabular-nums ${on ? "text-background/80" : "text-muted-foreground"}`}>{count}</span>
    </Link>
  );
}
