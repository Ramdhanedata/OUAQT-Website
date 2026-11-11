import { ArrowRight, CircleCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatMoney } from "@/app-ui";
import { wordFor } from "@/builder/admin/copy";
import { panelCopy } from "@/builder/admin/copy-panel";
import { AppsList } from "@/builder/admin/dashboard/apps-list";
import { StatusBreakdown, type Segment } from "@/builder/admin/dashboard/status-breakdown";
import { adminGate } from "@/builder/admin/guard";
import { adminWords } from "@/builder/admin/language";
import { LiveRefresh } from "@/builder/admin/live";
import { AdminNav } from "@/builder/admin/nav";
import { actionWords, loadOverview } from "@/builder/admin/overview";
import { ago } from "@/builder/admin/overview-math";
import { AdminSignIn } from "@/builder/admin/sign-in";
import { NO_LICENCE_COLOR, STATUS_COLOR } from "@/builder/admin/status-colors";
import { adminClient } from "@/builder/db/server";
import { fill } from "@/lib/utils";

/*
 * The overview: the page staff land on, and the one left open on a screen.
 *
 * Read top to bottom it answers: is anything waiting for me; the six
 * numbers that matter (customers, software running, paying licences, then
 * visitors to the site, people in the builder now, and downloads); whether
 * every service is working, one line each, and the rules owners meet; where
 * every customer stands and what ends this week; which copies of the
 * software are running, and what was last done. Every line opens the page
 * where something can be done about it, and the page re-reads itself every
 * fifteen seconds while it is in front of somebody.
 *
 * The day-by-day chart that used to sit in the middle is on the statistics
 * page, with every other figure over time: here it was a second copy.
 */

const SLOW_MS = 3_000;
type Tone = "good" | "warn" | "bad" | "neutral";
type Cell = { key: string; label: string; value: string; sub?: string; tone: Tone; href?: string };

export default async function OverviewPage() {
  const gate = await adminGate();
  const { lang, t, locale } = await adminWords();
  if (!gate.allowed) return <AdminSignIn reason={gate.reason} />;

  const supabase = adminClient();
  if (!supabase) return <p className="text-base text-foreground">{t.noDatabase}</p>;

  const now = new Date();
  const data = await loadOverview(supabase, now);
  const o = t.overview;
  const { board: b, rules: r, settings: sw } = panelCopy[lang];
  const number = new Intl.NumberFormat(locale);
  const money = (value: number) => formatMoney(value, lang);
  const since = (at: string | null) => (at ? ago(at, now, lang) : b.never);

  const todo = [
    { count: data.todo.payments, label: o.todo.payments, href: "/admin/paiements" },
    { count: data.todo.review, label: o.todo.review, href: "/admin/paiements" },
    { count: data.todo.codes, label: o.todo.codes, href: "/admin/demandes" },
    { count: data.todo.requests, label: o.todo.requests, href: "/admin/demandes" },
  ].filter((one) => one.count > 0);

  /* The bar's order is fixed, so a colour never moves from one state to another between refreshes. */
  const segments: Segment[] = [
    ...(["active", "trial", "renewal_due", "expired", "suspended"] as const).map((group) => ({
      key: group,
      label: o.tiles[group],
      count: data.clients[group],
      href: `/admin/clients?statut=${group}`,
      color: STATUS_COLOR[group],
    })),
    ...(data.clients.none > 0
      ? [{ key: "none", label: o.noLicence, count: data.clients.none, href: "/admin/clients?f=none", color: NO_LICENCE_COLOR }]
      : []),
  ];

  /*
   * The board: one line per service, each with a dot that is green when it
   * works, amber when it wants a look and red when owners are stopped by it.
   * A line whose facts could not be read is left out rather than guessed.
   */
  const { system } = data;
  const cells: Cell[] = [
    {
      key: "site",
      label: b.site,
      value: data.last.site ? fill(b.siteValue, { ago: since(data.last.site) }) : b.siteQuiet,
      tone: "good",
      href: "/admin/statistiques",
    },
    {
      key: "builder",
      label: b.builder,
      value: data.last.builder
        ? fill(b.builderValue, { now: number.format(data.kpi.visitorsNow), ago: since(data.last.builder) })
        : b.builderQuiet,
      tone: data.last.builder ? "good" : "neutral",
      href: "/admin/parcours",
    },
    {
      key: "apps",
      label: b.apps,
      value: data.kpi.activatedApps
        ? fill(b.appsValue, { online: number.format(data.kpi.onlineApps), total: number.format(data.kpi.activatedApps), ago: since(data.last.app) })
        : b.appsNone,
      sub: data.kpi.activatedApps
        ? fill(b.platforms, { windows: number.format(data.platforms.windows), mac: number.format(data.platforms.mac), phone: number.format(data.platforms.phone) })
        : undefined,
      tone: data.kpi.activatedApps ? "good" : "neutral",
      href: "/admin/postes",
    },
  ];

  if (system.links) {
    const missing = (system.files?.files ?? []).filter((one) => one.ok === false);
    const answered = Boolean(system.files?.files.length) && system.files!.files.every((one) => one.ok === true);
    const everyTrade = system.links.windows === system.links.total && system.links.mac === system.links.total;
    const version = system.files?.version ? `${system.files.version} · ` : "";
    cells.push({
      key: "downloads",
      label: b.downloads,
      ...(missing.length
        ? { value: fill(b.downloadsBroken, { files: missing.map((one) => one.name).join(", ") }), tone: "bad" as const }
        : !everyTrade
          ? { value: fill(b.downloadsMissing, system.links), tone: "warn" as const }
          : answered
            ? { value: `${version}${b.downloadsOk}`, tone: "good" as const }
            : { value: b.downloadsUnchecked, tone: "neutral" as const }),
      href: "/admin/reglages#downloads",
    });
  }

  cells.push({ key: "signing", label: b.signing, value: system.signing ? b.signingOk : b.signingMissing, tone: system.signing ? "good" : "bad" });

  if (system.paymentApps !== null && system.autoConfirm !== null) {
    cells.push({
      key: "payments",
      label: b.payments,
      value:
        system.paymentApps === 0
          ? b.paymentsNoNumber
          : fill(system.autoConfirm ? b.paymentsAuto : b.paymentsManual, { apps: number.format(system.paymentApps) }),
      tone: system.paymentApps === 0 ? "bad" : "good",
      href: "/admin/reglages#payments",
    });
  }

  if (system.ai) {
    const near = system.ai.limit > 0 && system.ai.used >= system.ai.limit * 0.8;
    cells.push({
      key: "ai",
      label: b.ai,
      value: fill(near ? b.aiNear : b.aiValue, { used: number.format(system.ai.used), limit: number.format(system.ai.limit) }),
      tone: near ? "warn" : "good",
      href: "/admin/reglages#ai",
    });
  }

  cells.push({
    key: "database",
    label: b.database,
    value: fill(system.ms > SLOW_MS ? b.databaseSlow : b.databaseValue, { ms: number.format(system.ms) }),
    tone: system.ms > SLOW_MS ? "warn" : "good",
  });

  const toCheck = cells.filter((one) => one.tone === "warn" || one.tone === "bad").length;
  const worst: Tone = cells.some((one) => one.tone === "bad") ? "bad" : toCheck ? "warn" : "good";

  const rules: { key: string; label: string; value: string; sub?: string; href: string }[] = data.rules
    ? [
        { key: "trial", label: r.trial, value: fill(r.trialValue, { days: number.format(data.rules.trialDays) }), href: "/admin/reglages#trial" },
        {
          key: "year",
          label: r.year,
          value: data.rules.annual === null ? r.notOffered : money(data.rules.annual),
          sub: data.rules.annualLaunch !== null ? `${sw.tiers.launch} ${money(data.rules.annualLaunch)}` : undefined,
          href: "/admin/reglages#prices",
        },
        { key: "month", label: r.month, value: data.rules.monthly === null ? r.notOffered : money(data.rules.monthly), href: "/admin/reglages#prices" },
        { key: "devices", label: r.devices, value: number.format(data.rules.maxDevices), href: "/admin/reglages#licence" },
        { key: "grace", label: r.grace, value: fill(r.graceValue, { days: number.format(data.rules.graceDays) }), href: "/admin/reglages#licence" },
      ]
    : [];

  /*
   * Day and month names in the reader's language. Arabic staff screens use
   * en-GB for dates beside Latin shop names; a date standing alone can have
   * its Arabic names, with Western digits all the same.
   */
  const dateLocale = lang === "ar" ? "ar-u-nu-latn" : locale;
  const today = now.toLocaleDateString(dateLocale, { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <AdminNav current="/admin" staff={gate.staff.name ?? t.staffFallback} />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground first-letter:uppercase">{today}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{o.title}</h1>
        </div>
        <LiveRefresh drawnAt={now.toISOString()} words={{ live: o.live, refresh: o.refresh }} locale={locale} />
      </header>

      {/* What waits for a person, or a quiet line saying nothing does. */}
      <div className="mt-6">
        {todo.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleCheck aria-hidden className="h-4 w-4 text-app-success" />
            {o.allClear}
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {todo.map((one) => (
              <li key={one.label}>
                <Link
                  href={one.href}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-app-warning/40 bg-app-warning-soft px-4 text-sm text-foreground hover:border-app-warning"
                >
                  <span className="text-base font-semibold">{number.format(one.count)}</span>
                  {one.label}
                  <ArrowRight aria-hidden className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* The numbers: the business on the first row, the traffic that feeds it on the second. */}
      <ul className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Kpi
          href="/admin/clients"
          label={o.kpi.clients}
          value={number.format(data.clients.total)}
          sub={fill(o.kpi.clientsSub, { count: number.format(data.kpi.newShops7) })}
        />
        <Kpi
          href="/admin/postes"
          label={o.kpi.online}
          live={data.kpi.onlineApps > 0}
          value={number.format(data.kpi.onlineApps)}
          sub={fill(o.kpi.onlineSub, { shops: number.format(data.kpi.onlineShops), total: number.format(data.kpi.activatedApps) })}
        />
        <Kpi
          href="/admin/clients?statut=active"
          label={o.kpi.paying}
          value={number.format(data.kpi.paying)}
          sub={fill(o.kpi.payingSub, { amount: money(data.kpi.monthAmount) })}
        />
        <Kpi
          href="/admin/statistiques"
          label={o.kpi.site}
          live={data.kpi.siteNow > 0}
          value={number.format(data.kpi.siteToday)}
          sub={fill(o.kpi.siteSub, { now: number.format(data.kpi.siteNow), week: number.format(data.kpi.siteWeek) })}
        />
        <Kpi
          href="/admin/parcours"
          label={o.kpi.visitors}
          live={data.kpi.visitorsNow > 0}
          value={number.format(data.kpi.visitorsNow)}
          sub={fill(o.kpi.visitorsSub, { count: number.format(data.kpi.visitorsToday) })}
        />
        <Kpi
          href="/admin/statistiques"
          label={o.kpi.downloads}
          value={number.format(data.kpi.downloads)}
          sub={fill(o.kpi.downloadsSub, {
            today: number.format(data.kpi.downloadsToday),
            windows: number.format(data.kpi.downloadsWindows),
            mac: number.format(data.kpi.downloadsMac),
          })}
        />
      </ul>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card
          title={b.title}
          className="lg:col-span-3"
          aside={
            <span
              className={`inline-flex h-7 items-center gap-2 rounded-full px-3 text-sm font-medium ${
                worst === "bad" ? "bg-app-danger-soft text-app-danger" : worst === "warn" ? "bg-app-warning-soft text-app-warning" : "bg-app-success-soft text-app-success"
              }`}
            >
              <span aria-hidden className={`h-2 w-2 rounded-full ${DOT[worst]}`} />
              {toCheck ? fill(b.toCheck, { count: number.format(toCheck) }) : b.allGood}
            </span>
          }
        >
          <ul className="-mx-2 grid gap-x-4 gap-y-1 sm:grid-cols-2">
            {cells.map((cell) => {
              const inside = (
                <>
                  <span aria-hidden className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[cell.tone]}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-muted-foreground">{cell.label}</span>
                    <span className={`block text-[15px] leading-snug ${cell.tone === "bad" ? "font-medium text-app-danger" : "text-foreground"}`}>{cell.value}</span>
                    {cell.sub ? <span className="block text-sm text-muted-foreground">{cell.sub}</span> : null}
                  </span>
                </>
              );
              return (
                <li key={cell.key}>
                  {cell.href ? (
                    <Link href={cell.href} className="flex h-full gap-3 rounded-lg p-2 hover:bg-foreground/[0.04]">
                      {inside}
                    </Link>
                  ) : (
                    <div className="flex h-full gap-3 p-2">{inside}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>

        <Card title={r.title} more={{ href: "/admin/reglages", label: r.change }} className="lg:col-span-2">
          {rules.length === 0 ? (
            <p className="text-sm text-muted-foreground">{r.unknown}</p>
          ) : (
            <ul className="-mx-2 divide-y divide-border">
              {rules.map((rule) => (
                <li key={rule.key}>
                  <Link href={rule.href} className="flex min-h-[48px] items-center justify-between gap-4 rounded-lg px-2 hover:bg-foreground/[0.04]">
                    <span className="text-[15px] text-muted-foreground">{rule.label}</span>
                    <span className="py-2 text-end">
                      <bdi className="block text-[15px] font-semibold text-foreground">{rule.value}</bdi>
                      {rule.sub ? <bdi className="block text-sm text-muted-foreground">{rule.sub}</bdi> : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card title={o.statusTitle} more={{ href: "/admin/clients", label: o.seeAll }} className="lg:col-span-3">
          <StatusBreakdown
            segments={segments}
            total={data.clients.total}
            totalLabel={o.tiles.total}
            locale={locale}
          />
        </Card>

        <Card title={o.endingTitle} className="lg:col-span-2">
          {data.ending.length === 0 ? (
            <p className="text-sm text-muted-foreground">{o.endingNone}</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.ending.map((one) => (
                <li key={one.businessId}>
                  <Link
                    href={`/admin/clients/${one.businessId}`}
                    className="-mx-2 flex min-h-[48px] items-center gap-3 rounded-lg px-2 hover:bg-foreground/[0.04]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium text-foreground">{one.businessName || "?"}</span>
                      <span className="block text-sm text-muted-foreground">{wordFor(t.plans, one.plan)}</span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums ${
                        one.daysLeft <= 2 ? "bg-app-warning-soft text-app-warning" : "bg-foreground/[0.05] text-foreground"
                      }`}
                    >
                      {one.daysLeft === 0 ? o.endsToday : fill(o.endsIn, { days: one.daysLeft })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card title={o.appsListTitle} more={{ href: "/admin/postes", label: o.seeAll }} className="lg:col-span-3">
          <AppsList
            apps={data.apps}
            drawnAt={now.toISOString()}
            lang={lang}
            words={{ filters: o.filters, noApps: o.noApps }}
            allHref="/admin/postes"
            allLabel={o.seeAll}
          />
        </Card>

        <Card title={o.historyTitle} className="lg:col-span-2">
          {data.trail.length === 0 ? (
            <p className="text-sm text-muted-foreground">{o.historyNone}</p>
          ) : (
            <ol className="space-y-3">
              {data.trail.map((one) => (
                <li key={one.id} className="flex gap-3">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span className="min-w-0 flex-1 text-[15px] text-foreground">
                    {actionWords(t.actions, one)}
                    {one.businessId && one.businessName ? (
                      <>
                        {" · "}
                        <Link
                          href={`/admin/clients/${one.businessId}`}
                          className="font-medium underline decoration-border underline-offset-4 hover:decoration-foreground"
                        >
                          {one.businessName}
                        </Link>
                      </>
                    ) : null}
                    <span className="block text-sm text-muted-foreground">
                      {one.actor === null ? o.automatic : one.actor || t.staffFallback} · {ago(one.at, now, lang)}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </>
  );
}

const DOT: Record<Tone, string> = { good: "bg-app-success", warn: "bg-app-warning", bad: "bg-app-danger", neutral: "bg-muted-foreground/50" };

function Card({
  title,
  more,
  aside,
  className = "",
  children,
}: {
  title: string;
  more?: { href: string; label: string };
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-2xl border border-border bg-surface p-5 sm:p-6 ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {aside}
        {more ? (
          <Link href={more.href} className="inline-flex min-h-[32px] items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            {more.label}
            <ArrowRight aria-hidden className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/* One headline figure: what it counts, the number, and one line of context. It opens its page when it has one. */
function Kpi({ href, label, value, sub, live }: { href?: string; label: string; value: string; sub: string; live?: boolean }) {
  const inside = (
    <>
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {live ? (
          <span aria-hidden className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-app-success opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-app-success" />
          </span>
        ) : null}
        {label}
      </span>
      <span className="mt-2 block text-4xl font-semibold tracking-tight text-foreground">
        <bdi dir="ltr">{value}</bdi>
      </span>
      <span className="mt-1 block text-sm leading-snug text-muted-foreground">{sub}</span>
    </>
  );
  const box = "block h-full rounded-2xl border border-border bg-surface p-5";
  return (
    <li>
      {href ? (
        <Link href={href} className={`${box} transition-colors hover:border-foreground/40`}>
          {inside}
        </Link>
      ) : (
        <div className={box}>{inside}</div>
      )}
    </li>
  );
}
