import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus, Sparkle } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatMoney } from "@/app-ui";
import { wordFor } from "@/builder/admin/copy";
import { growthCopy, paymentAppNames } from "@/builder/admin/copy-growth";
import { StatusBreakdown, type Segment } from "@/builder/admin/dashboard/status-breakdown";
import { TrendChart } from "@/builder/admin/dashboard/trend-chart";
import { adminGate } from "@/builder/admin/guard";
import { adminWords } from "@/builder/admin/language";
import { AdminNav } from "@/builder/admin/nav";
import { AdminSignIn } from "@/builder/admin/sign-in";
import { loadStats, METRICS, type Figure, type MetricKey } from "@/builder/admin/stats";
import { PERIODS, periodOf } from "@/builder/admin/stats-math";
import { NO_LICENCE_COLOR, STATUS_COLOR } from "@/builder/admin/status-colors";
import { adminClient } from "@/builder/db/server";
import { fill } from "@/lib/utils";

/*
 * Statistics: where OUAQT stands and which way it is going.
 *
 * Read top to bottom: the nine figures that make the business, each beside
 * the same figure for the period before; any of them day by day; the path
 * from a visit to a paying shop, with what is lost at each step; what is in
 * production now; the money; who the visitors are and what they look at;
 * what they ask for that OUAQT does not do yet; and what each representative
 * brought. The period is in the address (?p=30), so a view can be shared.
 */

type Props = { searchParams: Promise<{ p?: string }> };

export default async function StatisticsPage(props: Props) {
  const gate = await adminGate();
  const { t, lang, locale } = await adminWords();
  if (!gate.allowed) return <AdminSignIn reason={gate.reason} />;

  const supabase = adminClient();
  if (!supabase) return <p className="text-base">{t.noDatabase}</p>;

  const g = growthCopy[lang].stats;
  const period = periodOf((await props.searchParams).p);
  const data = await loadStats(supabase, period);
  const number = new Intl.NumberFormat(locale);
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
  const money = (value: number) => formatMoney(value, lang);
  const show = (key: MetricKey, value: number) => (key === "revenue" ? money(value) : number.format(value));

  const segments: Segment[] = [
    ...(["active", "trial", "renewal_due", "expired", "suspended"] as const).map((group) => ({
      key: group,
      label: t.overview.tiles[group],
      count: data.production.byStatus[group],
      href: `/admin/clients?statut=${group}`,
      color: STATUS_COLOR[group],
    })),
    ...(data.production.byStatus.none > 0
      ? [{ key: "none", label: g.production.none, count: data.production.byStatus.none, href: "/admin/clients", color: NO_LICENCE_COLOR }]
      : []),
  ];

  const pageName = (page: string) => (page === "/" ? g.breakdown.home : page);
  const deviceName = (device: string) => (device === "phone" ? g.breakdown.phone : device === "desktop" ? g.breakdown.desktop : g.breakdown.unknown);

  return (
    <>
      <AdminNav current="/admin/statistiques" staff={gate.staff.name ?? t.staffFallback} here={`/admin/statistiques?p=${period}`} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{g.title}</h1>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">{g.intro}</p>
        </div>
        <nav aria-label={g.title} className="grid w-full grid-cols-4 gap-1 rounded-xl bg-foreground/[0.05] p-1 sm:flex sm:w-auto">
          {PERIODS.map((one) => (
            <Link
              key={one}
              href={`/admin/statistiques?p=${one}`}
              aria-current={one === period ? "page" : undefined}
              className={`inline-flex min-h-[40px] items-center justify-center whitespace-nowrap rounded-lg px-2 text-sm sm:px-4 ${
                one === period ? "bg-surface font-medium text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {g.periods[one]}
            </Link>
          ))}
        </nav>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{fill(g.versus, { days: number.format(period) })}</p>

      {/* The nine figures, in the order a shop travels: found us, built, downloaded, used, paid. */}
      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {METRICS.map((key) => (
          <li key={key} className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-sm text-muted-foreground">{g.metrics[key]}</p>
            <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-3xl font-semibold tracking-tight text-foreground">
                <bdi dir="ltr">{show(key, data.figures[key].current)}</bdi>
              </span>
              <Change figure={data.figures[key]} words={g} locale={locale} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{fill(g.before, { value: show(key, data.figures[key].previous) })}</p>
            <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">{g.hints[key]}</p>
          </li>
        ))}
      </ul>

      <Section title={g.chartTitle} className="mt-4">
        <TrendChart
          metrics={METRICS.map((key) => ({ key, label: g.metrics[key], values: data.series[key], total: data.figures[key].current, money: key === "revenue" }))}
          buckets={data.buckets}
          words={{ total: g.chartTotal, week: g.chartWeek, empty: g.chartEmpty }}
          locale={locale}
          language={lang}
        />
      </Section>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Section title={g.funnelTitle} className="lg:col-span-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{g.funnelIntro}</p>
          <ol className="mt-5 space-y-4">
            {data.funnel.map((step, index) => {
              const first = data.funnel[0].count;
              const width = first > 0 ? Math.max((step.count / first) * 100, step.count > 0 ? 2 : 0) : 0;
              return (
                <li key={step.key}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="text-sm font-medium text-foreground">
                      <span className="me-2 text-muted-foreground tabular-nums">{index + 1}</span>
                      {g.metrics[step.key]}
                    </span>
                    <span className="text-lg font-semibold tabular-nums text-foreground">{number.format(step.count)}</span>
                  </div>
                  <div className="mt-1.5 h-2.5 rounded-full bg-foreground/[0.06]">
                    <div className="h-full rounded-full bg-[#2a78d6]" style={{ width: `${width}%` }} />
                  </div>
                  {step.ofPrevious !== null && step.ofPrevious <= 1 ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {fill(g.ofPrevious, { rate: percent.format(step.ofPrevious) })}
                      {step.ofFirst !== null && index > 1 ? ` · ${fill(g.ofFirst, { rate: percent.format(step.ofFirst) })}` : ""}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </Section>

        <Section title={g.productionTitle} className="lg:col-span-2">
          <p className="text-sm leading-relaxed text-muted-foreground">{g.productionIntro}</p>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
            <Pair label={g.production.shops} value={number.format(data.production.shops)} />
            <Pair label={g.production.computers} value={number.format(data.production.computers)} />
            <Pair label={g.production.onlineNow} value={number.format(data.production.online.now)} live={data.production.online.now > 0} />
            <Pair label={g.production.onlineToday} value={number.format(data.production.online.today)} />
            <Pair label={g.production.onlineWeek} value={number.format(data.production.online.week)} />
            <Pair
              label={g.breakdown.systems}
              value={fill(g.production.systems, { windows: number.format(data.production.platforms.windows), mac: number.format(data.production.platforms.mac) })}
              small
            />
          </dl>
          <h3 className="mb-3 mt-6 text-sm font-semibold text-foreground">{g.production.licences}</h3>
          <StatusBreakdown segments={segments} total={data.production.shops} totalLabel={g.production.shops} locale={locale} />
        </Section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Section title={g.revenueTitle}>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Pair label={g.metrics.revenue} value={money(data.figures.revenue.current)} />
            <Pair label={g.revenue.allTime} value={money(data.revenue.allTime)} />
            <Pair label={g.revenue.average} value={data.revenue.average === null ? "—" : money(data.revenue.average)} />
            <Pair label={g.metrics.paying} value={fill(g.revenue.payingShops, { count: number.format(data.revenue.payingShops) })} small />
          </dl>
          {data.revenue.byPlan.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">{g.revenue.none}</p>
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <BarList title={g.revenue.byPlan} rows={data.revenue.byPlan.map(([plan, value]) => [wordFor(t.plans, plan), value])} format={money} empty={g.breakdown.empty} />
              <BarList title={g.revenue.byApp} rows={data.revenue.byApp.map(([app, value]) => [paymentAppNames[app] ?? (app || g.breakdown.unknown), value])} format={money} empty={g.breakdown.empty} />
            </div>
          )}
        </Section>

        <Section title={g.demandTitle}>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <dt className="text-sm text-muted-foreground">{g.demand.leads}</dt>
              <dd className="mt-1 flex flex-wrap items-baseline gap-2">
                <span className="text-2xl font-semibold tabular-nums text-foreground">{number.format(data.demand.leads.current)}</span>
                <Change figure={data.demand.leads} words={g} locale={locale} />
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{g.demand.requests}</dt>
              <dd className="mt-1 flex flex-wrap items-baseline gap-2">
                <span className="text-2xl font-semibold tabular-nums text-foreground">{number.format(data.demand.requests.current)}</span>
                <Change figure={data.demand.requests} words={g} locale={locale} />
              </dd>
            </div>
          </dl>
          <div className="mt-6">
            <BarList title={g.demand.topLeads} rows={data.demand.leadTrades.map(([trade, count]) => [trade || g.breakdown.unknown, count])} format={(value) => number.format(value)} empty={g.breakdown.empty} />
          </div>
        </Section>
      </div>

      <Section title={g.breakdownTitle} className="mt-4">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <BarList title={g.breakdown.tradesBuilt} rows={data.breakdown.tradesBuilt.map(([pack, count]) => [wordFor(t.packs, pack) || g.breakdown.unknown, count])} format={(value) => number.format(value)} empty={g.breakdown.empty} />
          <BarList title={g.breakdown.tradesDownloaded} rows={data.breakdown.tradesDownloaded.map(([pack, count]) => [wordFor(t.packs, pack) || g.breakdown.unknown, count])} format={(value) => number.format(value)} empty={g.breakdown.empty} />
          <BarList title={g.breakdown.systems} rows={data.breakdown.systems.map(([system, count]) => [g.systems[system] ?? g.breakdown.unknown, count])} format={(value) => number.format(value)} empty={g.breakdown.empty} />
          <BarList title={g.breakdown.languages} rows={data.breakdown.languages.map(([language, count]) => [g.languages[language] ?? g.breakdown.unknown, count])} format={(value) => number.format(value)} empty={g.breakdown.empty} />
          <BarList title={g.breakdown.devices} rows={data.breakdown.devices.map(([device, count]) => [deviceName(device), count])} format={(value) => number.format(value)} empty={g.breakdown.empty} />
          <BarList title={g.breakdown.pages} rows={data.breakdown.pages.map(([page, count]) => [pageName(page), count])} format={(value) => number.format(value)} empty={g.breakdown.empty} ltrLabels />
        </div>
      </Section>

      <Section title={g.repsTitle} className="mt-4" more={{ href: "/admin/commerciaux", label: g.repsManage }}>
        <p className="text-sm leading-relaxed text-muted-foreground">{g.repsIntro}</p>
        {data.reps.length === 0 ? (
          <p className="mt-4 text-base text-muted-foreground">{g.repsEmpty}</p>
        ) : (
          <div className="-mx-5 mt-4 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
            <table className="w-full min-w-[720px] text-start text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  {(["name", "visits", "serials", "shops", "paying", "revenue", "due"] as const).map((column) => (
                    <th key={column} scope="col" className={`py-2 font-medium ${column === "name" ? "text-start" : "text-end"}`}>
                      {g.columns[column]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...data.reps]
                  .sort((a, b) => b.revenue - a.revenue || b.shops - a.shops || b.visits - a.visits)
                  .map((rep) => (
                    <tr key={rep.id} className="border-b border-border last:border-0">
                      <td className="py-3">
                        <Link href={`/admin/commerciaux/${rep.id}`} className="font-medium text-foreground hover:underline">
                          {rep.name}
                        </Link>
                        <span className="ms-2 font-mono text-xs text-muted-foreground" dir="ltr">
                          {rep.code}
                        </span>
                      </td>
                      <Cell>{number.format(rep.visits)}</Cell>
                      <Cell>{number.format(rep.serials)}</Cell>
                      <Cell>{number.format(rep.shops)}</Cell>
                      <Cell>{number.format(rep.paying)}</Cell>
                      <Cell>{money(rep.revenue)}</Cell>
                      <Cell strong>{money(Math.max(rep.allTime.earned - rep.allTime.paid, 0))}</Cell>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </>
  );
}

/* Up, down, steady or new against the period before. Green up, red down, never colour alone. */
function Change({ figure, words, locale }: { figure: Figure; words: { trendNew: string; trendFlat: string }; locale: string }) {
  const percent = new Intl.NumberFormat(locale, { signDisplay: "always", maximumFractionDigits: 0 });
  if (figure.trend === "new") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#2a78d6]/10 px-2 py-0.5 text-xs font-medium text-[#1c5cab]">
        <Sparkle aria-hidden className="h-3 w-3" />
        {words.trendNew}
      </span>
    );
  }
  if (figure.trend === "flat") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.06] px-2 py-0.5 text-xs font-medium text-muted-foreground">
        <Minus aria-hidden className="h-3 w-3" />
        {figure.percent === null ? words.trendFlat : `${percent.format(0)} %`}
      </span>
    );
  }
  const up = figure.trend === "up";
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        up ? "bg-app-success-soft text-app-success" : "bg-app-danger-soft text-app-danger"
      }`}
    >
      <Icon aria-hidden className="h-3.5 w-3.5 rtl:-scale-x-100" />
      <bdi dir="ltr">{percent.format(figure.percent ?? 0)} %</bdi>
    </span>
  );
}

function Section({ title, more, className = "", children }: { title: string; more?: { href: string; label: string }; className?: string; children: ReactNode }) {
  return (
    <section className={`rounded-2xl border border-border bg-surface p-5 sm:p-6 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {more ? (
          <Link href={more.href} className="inline-flex min-h-[32px] items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            {more.label}
            <ArrowRight aria-hidden className="h-4 w-4 rtl:rotate-180" />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Pair({ label, value, live, small }: { label: string; value: string; live?: boolean; small?: boolean }) {
  return (
    <div>
      <dt className="flex items-center gap-2 text-sm text-muted-foreground">
        {live ? <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-app-success" /> : null}
        {label}
      </dt>
      <dd className={`mt-1 font-semibold text-foreground ${small ? "text-base" : "text-2xl tabular-nums"}`}>
        <bdi>{value}</bdi>
      </dd>
    </div>
  );
}

/* A short ranked list, each row with a bar as long as its share of the largest. */
function BarList({
  title,
  rows,
  format,
  empty,
  ltrLabels,
}: {
  title: string;
  rows: [string, number][];
  format: (value: number) => string;
  empty: string;
  ltrLabels?: boolean;
}) {
  const top = Math.max(...rows.map(([, value]) => value), 0);
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {rows.map(([label, value]) => (
            <li key={label}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate text-foreground" dir={ltrLabels ? "ltr" : undefined}>
                  {label}
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  <bdi dir="ltr">{format(value)}</bdi>
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-foreground/[0.06]">
                <div className="h-full rounded-full bg-[#2a78d6]" style={{ width: `${top ? Math.max((value / top) * 100, 2) : 0}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Cell({ children, strong }: { children: ReactNode; strong?: boolean }) {
  return (
    <td className={`py-3 text-end tabular-nums ${strong ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
      <bdi dir="ltr">{children}</bdi>
    </td>
  );
}
