import { ArrowRight, CircleCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatMoney } from "@/app-ui";
import { wordFor } from "@/builder/admin/copy";
import { ActivityChart } from "@/builder/admin/dashboard/activity-chart";
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
 * visitors to the site, people in the builder now, and downloads); where every customer stands; which copies of the
 * software are running; what happened day by day; what ends this week; what
 * was last done; and whether the machinery is healthy. Every number opens
 * the page where something can be done about it, and the page re-reads
 * itself every fifteen seconds while it is in front of somebody.
 */

/* Recency of a computer's last check-in, from "online" to "gone quiet". */
const PRESENCE_COLOR = { now: "#1f8a3a", today: "#6b6b68", week: "#a8a59c", older: "#d6d3ca" } as const;

export default async function OverviewPage() {
  const gate = await adminGate();
  const { lang, t, locale } = await adminWords();
  if (!gate.allowed) return <AdminSignIn reason={gate.reason} />;

  const supabase = adminClient();
  if (!supabase) return <p className="text-base text-foreground">{t.noDatabase}</p>;

  const now = new Date();
  const data = await loadOverview(supabase, now);
  const o = t.overview;
  const number = new Intl.NumberFormat(locale);

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
      ? [{ key: "none", label: o.noLicence, count: data.clients.none, href: "/admin/clients", color: NO_LICENCE_COLOR }]
      : []),
  ];

  const ai = data.system.ai;
  const aiNear = ai !== null && ai.limit > 0 && ai.used >= ai.limit * 0.8;
  const presenceTotal = Object.values(data.presence).reduce((sum, one) => sum + one, 0);
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
          sub={fill(o.kpi.payingSub, { amount: formatMoney(data.kpi.monthAmount, lang) })}
        />
        <Kpi
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
        <Card title={o.statusTitle} more={{ href: "/admin/clients", label: o.seeAll }} className="lg:col-span-3">
          <StatusBreakdown
            segments={segments}
            total={data.clients.total}
            totalLabel={o.tiles.total}
            locale={locale}
          />
        </Card>

        <Card title={o.appsTitle} className="lg:col-span-2">
          <p className="text-sm leading-relaxed text-muted-foreground">{o.appsIntro}</p>
          <ul className="mt-4 space-y-4">
            {(["now", "today", "week", "older"] as const).map((key) => {
              const count = data.presence[key];
              const share = presenceTotal ? (count / presenceTotal) * 100 : 0;
              return (
                <li key={key}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="flex items-center gap-2 text-[15px] text-foreground">
                      <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PRESENCE_COLOR[key] }} />
                      {o.presence[key]}
                    </span>
                    <span className="text-[15px] font-semibold tabular-nums text-foreground">{number.format(count)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-foreground/[0.06]" dir="ltr">
                    <div className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: PRESENCE_COLOR[key] }} />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-5 text-sm text-muted-foreground">
            {fill(o.platforms, { windows: number.format(data.platforms.windows), mac: number.format(data.platforms.mac) })}
          </p>
        </Card>
      </div>

      <Card title={o.activityTitle} className="mt-4">
        <ActivityChart
          series={data.series}
          words={{ series: o.series, range: o.range, periodTotal: o.periodTotal, chartEmpty: o.chartEmpty }}
          locale={dateLocale}
        />
      </Card>

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
        <Card title={o.historyTitle} className="lg:col-span-3">
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

        <Card title={o.systemTitle} className="lg:col-span-2">
          <ul className="space-y-3">
            <Check tone={data.system.signing ? "good" : "bad"}>{data.system.signing ? o.signingOk : o.signingMissing}</Check>
            {ai ? <Check tone={aiNear ? "warn" : "good"}>{fill(aiNear ? o.aiNear : o.aiUse, { used: ai.used, limit: ai.limit })}</Check> : null}
            {data.system.autoConfirm !== null ? (
              <Check tone="neutral">{data.system.autoConfirm ? o.autoConfirmOn : o.autoConfirmOff}</Check>
            ) : null}
            {data.system.downloads ? (
              <Check tone={data.system.downloads.windows > 0 ? "good" : "warn"}>{fill(o.downloads, data.system.downloads)}</Check>
            ) : null}
          </ul>
        </Card>
      </div>
    </>
  );
}

function Card({
  title,
  more,
  className = "",
  children,
}: {
  title: string;
  more?: { href: string; label: string };
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-2xl border border-border bg-surface p-5 sm:p-6 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
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

const CHECK_DOT = { good: "bg-app-success", warn: "bg-app-warning", bad: "bg-app-danger", neutral: "bg-muted-foreground" };

function Check({ tone, children }: { tone: keyof typeof CHECK_DOT; children: ReactNode }) {
  return (
    <li className="flex gap-3 text-sm leading-relaxed text-foreground">
      <span aria-hidden className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${CHECK_DOT[tone]}`} />
      <span>{children}</span>
    </li>
  );
}
