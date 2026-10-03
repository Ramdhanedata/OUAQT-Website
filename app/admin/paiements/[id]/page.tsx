import Link from "next/link";
import type { ReactNode } from "react";
import { CONFIRM_COLUMNS, confirmRowsFor, signedScreenshot } from "@/builder/admin/confirm-rows";
import { wordFor } from "@/builder/admin/copy";
import { paymentsCopy } from "@/builder/admin/copy-payments";
import { adminGate } from "@/builder/admin/guard";
import { adminWords } from "@/builder/admin/language";
import { AdminNav } from "@/builder/admin/nav";
import { loadPaymentActivity, loadPaymentLine } from "@/builder/admin/payment-history";
import { needsAPerson, overpaid, refundOwed, stateOf } from "@/builder/admin/payment-rules";
import { ActivityList, checkWords, money, PaymentBadge, type Words } from "@/builder/admin/payment-views";
import { PaymentsToConfirm } from "@/builder/admin/payments";
import { RefundButton } from "@/builder/admin/refund-button";
import { AdminSignIn } from "@/builder/admin/sign-in";
import { adminClient } from "@/builder/db/server";
import { appName } from "@/builder/payment/apps";
import { fill } from "@/lib/utils";

/*
 * One payment, everything about it: the shop, what was sent and what it
 * bought, how it came (by serial or from an account, the length chosen or
 * read from the amount), what the screenshot showed and which checks it
 * failed, the screenshot itself, who decided and why, what is owed back,
 * and its own history. When a person still has something to do about it,
 * the same card as the list to handle, so it is decided the same way.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = { params: Promise<{ id: string }> };

export default async function PaymentPage(props: Props) {
  const gate = await adminGate();
  const { lang, t, locale } = await adminWords();
  if (!gate.allowed) return <AdminSignIn reason={gate.reason} />;

  const supabase = adminClient();
  if (!supabase) return <p className="text-base text-foreground">{t.noDatabase}</p>;

  const p = paymentsCopy[lang];
  const words: Words = { p, plans: t.plans, packs: t.packs, lang, locale, staffFallback: t.staffFallback };
  const nav = <AdminNav current="/admin/paiements" staff={gate.staff.name ?? t.staffFallback} />;
  const back = (
    <Link href="/admin/paiements?vue=tous" className="inline-flex min-h-[40px] items-center text-sm text-muted-foreground hover:text-foreground">
      ← {p.detail.back}
    </Link>
  );

  const { id } = await props.params;
  const line = UUID.test(id) ? await loadPaymentLine(supabase, id) : null;
  if (!line) {
    return (
      <>
        {nav}
        {back}
        <p className="mt-6 text-base text-muted-foreground">{p.detail.notFound}</p>
      </>
    );
  }

  const now = new Date();
  const state = stateOf(line);
  const owed = refundOwed(line);
  const extra = overpaid(line);
  const [screenshot, activity, toDecide] = await Promise.all([
    signedScreenshot(supabase, line.screenshotPath),
    loadPaymentActivity(supabase, line.id),
    needsAPerson(line)
      ? supabase
          .from("payments")
          .select(CONFIRM_COLUMNS)
          .eq("id", line.id)
          .then(({ data }) => confirmRowsFor(supabase, data ?? []))
      : Promise.resolve([]),
  ]);
  const when = (iso: string) => new Date(iso).toLocaleString(locale, { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const day = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString(locale, { timeZone: "UTC" });

  return (
    <>
      {nav}
      {back}
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          <Link href={`/admin/clients/${line.businessId}`} className="hover:underline">
            {line.businessName || "—"}
          </Link>
        </h1>
        <PaymentBadge state={state} words={words} />
      </div>
      <p className="mt-1 text-base text-muted-foreground">
        {wordFor(t.packs, line.pack)} · {when(line.createdAt)}
      </p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Figure label={p.detail.sent} value={line.read != null ? money(line.read, words) : p.row.notRead} />
        <Figure label={p.detail.price} value={money(line.expected, words)} sub={wordFor(t.plans, line.plan)} />
        <Figure label={p.detail.app} value={appName(line.app, lang)} sub={line.reference ?? undefined} />
        <Figure
          label={p.figures.refunds}
          value={money(owed > 0 ? owed : line.refunded ?? 0, words)}
          sub={owed > 0 ? p.states.pending : line.refunded != null ? fill(p.row.refunded, { amount: money(line.refunded, words) }) : undefined}
          strong={owed > 0}
        />
      </ul>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {toDecide.length > 0 ? (
          <Card title={p.detail.decideTitle} className="lg:col-span-2">
            <PaymentsToConfirm
              rows={toDecide}
              words={{ t: t.payments, packs: t.packs, plans: t.plans, lang, locale }}
              review={state === "confirmed_auto"}
            />
          </Card>
        ) : null}

        {extra > 0 ? (
          <Card title={p.detail.refundTitle} className="lg:col-span-2">
            {owed > 0 ? (
              <>
                <p className="mb-4 text-base leading-relaxed text-foreground">
                  {fill(p.detail.refundIntro, {
                    sent: money(line.read ?? 0, words),
                    price: money(line.expected, words),
                    amount: money(owed, words),
                  })}
                </p>
                <RefundButton paymentId={line.id} amount={money(owed, words)} words={p.refund} />
              </>
            ) : (
              <p className="text-base text-foreground">
                {fill(p.detail.refundDone, {
                  amount: money(line.refunded ?? 0, words),
                  date: line.refundedAt ? when(line.refundedAt) : "",
                  name: line.refundedBy || t.staffFallback,
                })}
              </p>
            )}
          </Card>
        ) : null}

        <Card title={p.detail.state}>
          <dl className="space-y-2">
            <Line label={p.detail.shop} value={<Link href={`/admin/clients/${line.businessId}`} className="underline underline-offset-4">{line.businessName || "—"}</Link>} />
            <Line label={p.detail.received} value={when(line.createdAt)} />
            <Line label={p.detail.state} value={p.states[state]} />
            <Line
              label={p.detail.plan}
              value={`${wordFor(t.plans, line.plan)}${
                line.filed.planChosen === null ? "" : ` (${line.filed.planChosen ? p.detail.planChosen : p.detail.planFromAmount})`
              }`}
            />
            <Line label={p.detail.price} value={money(line.expected, words)} />
            <Line label={p.detail.sent} value={line.read != null ? money(line.read, words) : p.row.notRead} />
            <Line label={p.detail.app} value={appName(line.app, lang)} />
            {line.filed.bySerial === null ? null : (
              <Line label={p.detail.paidWith} value={line.filed.bySerial ? p.row.bySerial : p.row.byAccount} />
            )}
            <Line label={p.detail.reference} value={line.reference ? <bdi dir="ltr">{line.reference}</bdi> : p.detail.none} />
            <Line label={p.detail.readDate} value={line.readDate ? day(line.readDate) : p.detail.none} />
            <Line label={p.detail.recipient} value={line.recipient ? <bdi dir="ltr">{line.recipient}</bdi> : p.detail.none} />
            {state === "pending" ? null : (
              <Line
                label={p.detail.decidedBy}
                value={
                  state === "confirmed_auto" || state === "rejected_auto"
                    ? p.detail.automatic
                    : `${line.reviewer || t.staffFallback}${line.reviewedAt ? ` · ${when(line.reviewedAt)}` : ""}`
                }
              />
            )}
            {line.reason ? <Line label={p.detail.reason} value={line.reason} /> : null}
          </dl>
        </Card>

        <Card title={p.detail.checksTitle}>
          {line.extracted === null ? (
            <p className="text-base text-muted-foreground">{p.detail.checksNotRead}</p>
          ) : line.filed.failures.length === 0 ? (
            <p className="text-base text-foreground">{p.detail.checksPassed}</p>
          ) : (
            <ul className="space-y-2">
              {line.filed.failures.map((failure, index) => (
                <li key={index} className="text-base text-app-danger">
                  {checkWords(failure, words)}
                </li>
              ))}
            </ul>
          )}
          <h3 className="mb-3 mt-6 text-sm font-semibold text-foreground">{p.detail.screenshot}</h3>
          {screenshot ? (
            <a href={screenshot} target="_blank" rel="noreferrer" className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={screenshot} alt={p.detail.screenshotAlt} className="max-h-[28rem] rounded-lg border border-border object-contain" />
            </a>
          ) : (
            <p className="text-base text-app-danger">{p.detail.noScreenshot}</p>
          )}
        </Card>

        <Card title={p.detail.activityTitle} className="lg:col-span-2">
          <ActivityList entries={activity} words={words} now={now} withShop={false} />
        </Card>
      </div>
    </>
  );
}

function Card({ title, className = "", children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <section className={`rounded-2xl border border-border bg-surface p-5 sm:p-6 ${className}`}>
      <h2 className="mb-4 text-base font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Figure({ label, value, sub, strong = false }: { label: string; value: string; sub?: string; strong?: boolean }) {
  return (
    <li className={`rounded-2xl border bg-surface p-5 ${strong ? "border-foreground/40" : "border-border"}`}>
      <span className="block text-sm text-muted-foreground">{label}</span>
      <span className="mt-2 block truncate text-2xl font-semibold tracking-tight text-foreground">{value}</span>
      {sub ? <span className="mt-1 block truncate text-sm text-muted-foreground">{sub}</span> : null}
    </li>
  );
}

function Line({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-x-3 text-[15px]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-foreground">{value}</dd>
    </div>
  );
}
