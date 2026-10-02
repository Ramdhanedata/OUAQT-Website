import { ArrowLeft, Download, Printer } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatMoney } from "@/app-ui";
import { wordFor } from "@/builder/admin/copy";
import { growthCopy } from "@/builder/admin/copy-growth";
import { adminGate } from "@/builder/admin/guard";
import { adminWords } from "@/builder/admin/language";
import { AdminNav } from "@/builder/admin/nav";
import { CopyLink, PayoutForm, RepActiveButton, RepEditForm } from "@/builder/admin/rep-forms";
import { repDetail, repLink, repQrSvg, ruleWords } from "@/builder/admin/reps";
import { AdminSignIn } from "@/builder/admin/sign-in";
import { loadStats } from "@/builder/admin/stats";
import { adminClient } from "@/builder/db/server";
import { fill } from "@/lib/utils";

/*
 * One representative: their QR code to hand out, what they brought these 30
 * days and since they started, what that earns them and what is still owed,
 * the shops they brought with what each has paid, what they were paid, and
 * their bonus to change.
 */

type Props = { params: Promise<{ id: string }> };

export default async function RepresentativePage(props: Props) {
  const gate = await adminGate();
  const { t, lang, locale } = await adminWords();
  if (!gate.allowed) return <AdminSignIn reason={gate.reason} />;

  const supabase = adminClient();
  if (!supabase) return <p className="text-base">{t.noDatabase}</p>;

  const { id } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [detail, stats] = await Promise.all([repDetail(supabase, id), loadStats(supabase, 30)]);
  if (!detail) notFound();

  const r = growthCopy[lang].reps;
  const { rep, shops, payouts } = detail;
  const figures = stats.reps.find((one) => one.id === id);
  const link = repLink(rep.code);
  const svg = await repQrSvg(rep.code);
  const number = new Intl.NumberFormat(locale);
  const money = (value: number) => formatMoney(value, lang);
  const day = (value: string) => new Date(value).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  const due = figures ? Math.max(figures.allTime.earned - figures.allTime.paid, 0) : 0;

  return (
    <>
      <AdminNav current="/admin/commerciaux" staff={gate.staff.name ?? t.staffFallback} here={`/admin/commerciaux/${id}`} />
      <Link href="/admin/commerciaux" className="inline-flex min-h-[40px] items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft aria-hidden className="h-4 w-4 rtl:rotate-180" />
        {r.back}
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{rep.name}</h1>
        {rep.active ? null : <span className="rounded-full bg-foreground/[0.06] px-2.5 py-1 text-sm font-medium text-muted-foreground">{r.inactive}</span>}
      </div>
      <p className="mt-2 text-base text-muted-foreground">
        {r.code} <span className="font-mono font-semibold tracking-wider text-foreground" dir="ltr">{rep.code}</span>
        {" · "}
        {fill(r.since, { date: day(rep.createdAt) })}
        {rep.phone ? (
          <>
            {" · "}
            <bdi dir="ltr">{rep.phone}</bdi>
          </>
        ) : null}
      </p>
      <p className="mt-1 text-base text-muted-foreground">
        {ruleWords(r, rep, { number: (value) => number.format(value), money })}
      </p>
      {rep.note ? <p className="mt-1 text-sm text-muted-foreground">{rep.note}</p> : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6 lg:col-span-2">
          <div
            className="mx-auto aspect-square w-full max-w-[260px] overflow-hidden rounded-xl border border-border bg-white p-2 [&_svg]:h-full [&_svg]:w-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <p className="mt-4 text-center text-sm text-muted-foreground">{r.link}</p>
          <p className="mt-1 break-all text-center font-mono text-sm text-foreground" dir="ltr">
            {link}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <CopyLink t={r} link={link} />
            <a
              href={`/api/admin/reps/qr?id=${rep.id}`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:border-foreground/40"
            >
              <Download aria-hidden className="h-4 w-4" />
              {r.downloadQr}
            </a>
            <Link
              href={`/admin/commerciaux/${rep.id}/carte`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:border-foreground/40"
            >
              <Printer aria-hidden className="h-4 w-4" />
              {r.printCard}
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6 lg:col-span-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{r.periodLabel}</p>
          <dl className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-5">
            <Figure label={r.figures.visits} value={number.format(figures?.visits ?? 0)} />
            <Figure label={r.figures.serials} value={number.format(figures?.serials ?? 0)} />
            <Figure label={r.figures.shops} value={number.format(figures?.shops ?? 0)} />
            <Figure label={r.figures.paying} value={number.format(figures?.paying ?? 0)} />
            <Figure label={r.figures.revenue} value={money(figures?.revenue ?? 0)} />
          </dl>
          <p className="mt-6 text-xs font-medium uppercase tracking-wide text-muted-foreground">{r.allTimeLabel}</p>
          <dl className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Figure label={r.figures.shops} value={number.format(figures?.allTime.shops ?? 0)} />
            <Figure label={r.figures.paying} value={number.format(figures?.allTime.paying ?? 0)} />
            <Figure label={r.figures.revenue} value={money(figures?.allTime.revenue ?? 0)} />
            <Figure label={r.figures.earned} value={money(figures?.allTime.earned ?? 0)} />
            <Figure label={r.figures.paid} value={money(figures?.allTime.paid ?? 0)} />
            <Figure label={r.figures.due} value={money(due)} strong />
          </dl>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6 lg:col-span-3">
          <h2 className="text-base font-semibold text-foreground">{r.shopsTitle}</h2>
          {shops.length === 0 ? (
            <p className="mt-3 text-base text-muted-foreground">{r.shopsEmpty}</p>
          ) : (
            <div className="-mx-5 mt-3 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th scope="col" className="py-2 text-start font-medium">{r.shopColumns.name}</th>
                    <th scope="col" className="py-2 text-start font-medium">{r.shopColumns.trade}</th>
                    <th scope="col" className="py-2 text-start font-medium">{r.shopColumns.since}</th>
                    <th scope="col" className="py-2 text-end font-medium">{r.shopColumns.paid}</th>
                  </tr>
                </thead>
                <tbody>
                  {shops.map((shop) => (
                    <tr key={shop.id} className="border-b border-border last:border-0">
                      <td className="py-3">
                        <Link href={`/admin/clients/${shop.id}`} className="font-medium text-foreground hover:underline">
                          {shop.name}
                        </Link>
                      </td>
                      <td className="py-3 text-muted-foreground">{wordFor(t.packs, shop.pack)}</td>
                      <td className="py-3 text-muted-foreground">{day(shop.createdAt)}</td>
                      <td className="py-3 text-end tabular-nums text-foreground">
                        <bdi dir="ltr">{money(shop.paid)}</bdi>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6 lg:col-span-2">
          <h2 className="text-base font-semibold text-foreground">{r.payoutsTitle}</h2>
          {payouts.length === 0 ? (
            <p className="mt-3 text-base text-muted-foreground">{r.payoutsEmpty}</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {payouts.map((payout) => (
                <li key={payout.id} className="flex items-baseline justify-between gap-3 py-2.5">
                  <span className="text-sm text-muted-foreground">
                    {day(payout.paidAt)}
                    {payout.note ? ` · ${payout.note}` : ""}
                  </span>
                  <span className="shrink-0 font-medium tabular-nums text-foreground">
                    <bdi dir="ltr">{money(payout.amount)}</bdi>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <PayoutForm t={r} id={rep.id} />
        </section>
      </div>

      <section className="mt-4 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">{r.editTitle}</h2>
        <RepEditForm
          t={r}
          id={rep.id}
          initial={{
            name: rep.name,
            phone: rep.phone ?? "",
            percent: String(rep.percent),
            perShop: String(rep.perShop / 100),
            note: rep.note ?? "",
          }}
        />
        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-border pt-5">
          <RepActiveButton t={r} id={rep.id} active={rep.active} />
          <p className="max-w-md text-sm text-muted-foreground">{r.activeHint}</p>
        </div>
      </section>
    </>
  );
}

function Figure({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={`mt-1 tabular-nums ${strong ? "text-2xl font-semibold text-foreground" : "text-xl font-semibold text-foreground"}`}>
        <bdi dir="ltr">{value}</bdi>
      </dd>
    </div>
  );
}
