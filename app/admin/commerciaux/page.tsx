import { ArrowRight, ChevronDown, Download, Plus } from "lucide-react";
import Link from "next/link";
import { formatMoney } from "@/app-ui";
import { growthCopy } from "@/builder/admin/copy-growth";
import { panelCopy } from "@/builder/admin/copy-panel";
import { adminGate } from "@/builder/admin/guard";
import { adminWords } from "@/builder/admin/language";
import { AdminNav } from "@/builder/admin/nav";
import { CopyLink, RepCreateForm, RepRemoveButton } from "@/builder/admin/rep-forms";
import { repLink, repQrSvg, ruleWords } from "@/builder/admin/reps";
import { AdminSignIn } from "@/builder/admin/sign-in";
import { loadStats } from "@/builder/admin/stats";
import type { Period } from "@/builder/admin/stats-math";
import { adminClient } from "@/builder/db/server";
import { fill } from "@/lib/utils";

/*
 * The representatives: everyone who brings OUAQT to shops, each with their
 * QR code, what they brought these 30 days, and what they are still owed.
 *
 * Adding one is the first thing on the page and removing one is on each
 * card, since those are the two things staff come here to do. How the bonus
 * is counted folds away once it has been read, and the ones taken off the
 * list sit at the bottom, out of the way but not lost.
 */

const RECENT_DAYS: Period = 30; // not-a-rule: the window each card's figures cover

export default async function RepresentativesPage() {
  const gate = await adminGate();
  const { t, lang, locale } = await adminWords();
  if (!gate.allowed) return <AdminSignIn reason={gate.reason} />;

  const supabase = adminClient();
  if (!supabase) return <p className="text-base">{t.noDatabase}</p>;

  const r = growthCopy[lang].reps;
  const w = panelCopy[lang].reps;
  const [stats, { data: rules }] = await Promise.all([
    loadStats(supabase, RECENT_DAYS),
    supabase.from("representatives").select("id, commission_percent, bonus_per_client"),
  ]);
  const ruleOf = new Map((rules ?? []).map((one) => [one.id as string, { percent: Number(one.commission_percent), perShop: Number(one.bonus_per_client) }]));
  const qr = new Map(await Promise.all(stats.reps.map(async (rep) => [rep.id, await repQrSvg(rep.code)] as const)));
  const number = new Intl.NumberFormat(locale);
  const money = (value: number) => formatMoney(value, lang);
  /* Among the active, whoever has brought the most comes first. */
  const byWhatTheyBrought = [...stats.reps].sort(
    (a, b) => b.allTime.revenue - a.allTime.revenue || b.allTime.shops - a.allTime.shops || a.name.localeCompare(b.name)
  );
  const active = byWhatTheyBrought.filter((rep) => rep.active);
  const former = byWhatTheyBrought.filter((rep) => !rep.active);
  const fold = "flex min-h-[44px] cursor-pointer list-none items-center gap-2 text-sm font-medium [&::-webkit-details-marker]:hidden";

  return (
    <>
      <AdminNav current="/admin/commerciaux" staff={gate.staff.name ?? t.staffFallback} />
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">{r.title}</h1>
      <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">{r.intro}</p>

      {/* Open by itself while there is nobody yet: adding the first one is all there is to do. */}
      <details className="group mt-6" open={stats.reps.length === 0}>
        <summary className="inline-flex min-h-[48px] cursor-pointer list-none items-center gap-2 rounded-lg bg-foreground px-5 text-base font-medium text-background [&::-webkit-details-marker]:hidden">
          <Plus aria-hidden className="h-4 w-4" />
          {r.addTitle}
        </summary>
        <div className="mt-4">
          <RepCreateForm t={r} />
        </div>
      </details>

      <details className="group mt-3">
        <summary className={`${fold} text-muted-foreground hover:text-foreground`}>
          <ChevronDown aria-hidden className="h-4 w-4 transition-transform group-open:rotate-180" />
          {r.howTitle}
        </summary>
        <ol className="mt-2 grid gap-3 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2 sm:p-6">
          {r.how.map((line, index) => (
            <li key={line} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground/[0.06] text-xs font-semibold text-foreground">
                {index + 1}
              </span>
              {line}
            </li>
          ))}
        </ol>
      </details>

      {active.length === 0 ? (
        <p className="mt-6 text-base text-muted-foreground">{r.empty}</p>
      ) : (
        <ul className="mt-4 grid gap-4 lg:grid-cols-2">
          {active.map((rep) => {
            const rule = ruleOf.get(rep.id);
            const due = Math.max(rep.allTime.earned - rep.allTime.paid, 0);
            return (
              <li key={rep.id} className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
                <div className="flex gap-5">
                  <div
                    className="h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-border bg-white p-1.5 [&_svg]:h-full [&_svg]:w-full"
                    dangerouslySetInnerHTML={{ __html: qr.get(rep.id) ?? "" }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/commerciaux/${rep.id}`} className="text-lg font-semibold text-foreground hover:underline">
                        {rep.name}
                      </Link>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {r.code} <span className="font-mono font-semibold tracking-wider text-foreground" dir="ltr">{rep.code}</span>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ruleWords(r, rule ?? { percent: 0, perShop: 0 }, { number: (value) => number.format(value), money })}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground" dir="ltr">
                      {repLink(rep.code)}
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{r.periodLabel}</p>
                <dl className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Figure label={r.figures.visits} value={number.format(rep.visits)} />
                  <Figure label={r.figures.serials} value={number.format(rep.serials)} />
                  <Figure label={r.figures.shops} value={number.format(rep.shops)} />
                  <Figure label={r.figures.paying} value={number.format(rep.paying)} />
                </dl>
                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-3">
                  <Figure label={`${r.figures.revenue} · ${r.allTimeLabel}`} value={money(rep.allTime.revenue)} />
                  <Figure label={r.figures.earned} value={money(rep.allTime.earned)} />
                  <Figure label={r.figures.due} value={money(due)} strong />
                </dl>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href={`/admin/commerciaux/${rep.id}`}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background"
                  >
                    {r.open}
                    <ArrowRight aria-hidden className="h-4 w-4 rtl:rotate-180" />
                  </Link>
                  <CopyLink t={r} link={repLink(rep.code)} />
                  <a
                    href={`/api/admin/reps/qr?id=${rep.id}`}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:border-foreground/40"
                  >
                    <Download aria-hidden className="h-4 w-4" />
                    {r.downloadQr}
                  </a>
                  <RepRemoveButton t={r} w={w} id={rep.id} name={rep.name} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {former.length > 0 ? (
        <details className="group mt-8">
          <summary className={`${fold} text-foreground`}>
            <ChevronDown aria-hidden className="h-4 w-4 transition-transform group-open:rotate-180" />
            {fill(w.formerTitle, { count: number.format(former.length) })}
          </summary>
          <p className="mt-1 text-sm text-muted-foreground">{w.formerHint}</p>
          <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-surface px-5">
            {former.map((rep) => (
              <li key={rep.id}>
                <Link href={`/admin/commerciaux/${rep.id}`} className="flex min-h-[56px] flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 hover:underline">
                  <span className="text-[15px] font-medium text-foreground">
                    {rep.name}
                    <span className="ms-2 font-mono text-sm font-normal tracking-wider text-muted-foreground" dir="ltr">
                      {rep.code}
                    </span>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {r.figures.shops} {number.format(rep.allTime.shops)} · {r.figures.due}{" "}
                    <bdi dir="ltr">{money(Math.max(rep.allTime.earned - rep.allTime.paid, 0))}</bdi>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </>
  );
}

function Figure({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs leading-snug text-muted-foreground">{label}</dt>
      <dd className={`mt-0.5 tabular-nums ${strong ? "text-lg font-semibold text-foreground" : "text-base font-medium text-foreground"}`}>
        <bdi dir="ltr">{value}</bdi>
      </dd>
    </div>
  );
}
