import Link from "next/link";
import { formatMoney } from "@/app-ui";
import { appName } from "@/builder/payment/apps";
import type { CheckFailure } from "@/builder/payment/checks";
import { fill } from "@/lib/utils";
import { wordFor, type AdminLanguage } from "./copy";
import type { PaymentsCopy } from "./copy-payments";
import { ago } from "./overview-math";
import type { ActivityEntry, PaymentLine } from "./payment-history";
import { owedBack, refundOwed, stateOf, type PaymentState } from "./payment-rules";

/*
 * The pieces the payments pages share: a payment's state as a badge, one
 * payment as a line of the list, what happened to payments as a list, and
 * a check that failed said in staff's words. The same colours as the
 * licence badges for the same meanings: green paid, blue a machine decided
 * and nobody has looked, amber waiting, red refused, grey taken back.
 */

const STATE_COLOR: Record<PaymentState, string> = {
  pending: "#c98500",
  confirmed_auto: "#2a78d6",
  confirmed_auto_checked: "#1f8a3a",
  confirmed: "#1f8a3a",
  rejected_auto: "#d03b3b",
  rejected_manual: "#d03b3b",
  undone: "#8a8a8a",
};

export type Words = {
  p: PaymentsCopy;
  plans: Record<string, string>;
  packs: Record<string, string>;
  lang: AdminLanguage;
  locale: string;
  staffFallback: string;
};

export function PaymentBadge({ state, words }: { state: PaymentState; words: Words }) {
  return (
    <span className="inline-flex h-7 shrink-0 items-center gap-2 rounded-full border border-border bg-surface px-3 text-sm font-medium text-foreground">
      <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: STATE_COLOR[state] }} />
      {words.p.states[state]}
    </span>
  );
}

export function money(minor: number, words: Words): string {
  return formatMoney(minor, words.lang);
}

/* A check that failed, in staff's words, with the amounts and dates written the reader's way. */
export function checkWords(failure: CheckFailure, words: Words): string {
  const value = (raw: unknown, code: string): string => {
    if (Array.isArray(raw)) return raw.map((one) => money(Number(one), words)).join(" / ");
    if (raw == null) return "";
    if ((code.includes("amount") || code === "amount_too_low") && typeof raw === "number") return money(raw, words);
    if (code.includes("date")) return new Date(`${String(raw)}T00:00:00Z`).toLocaleDateString(words.locale, { timeZone: "UTC" });
    return String(raw);
  };
  const template = words.p.checks[failure.code] ?? failure.code;
  return fill(template, { expected: value(failure.expected, failure.code), found: value(failure.found, failure.code) });
}

/* One payment as a line: who, how much, for what, where it stands, what is owed. */
export function PaymentListItem({ line, words, now }: { line: PaymentLine; words: Words; now: Date }) {
  const state = stateOf(line);
  const owed = refundOwed(line);
  const extra = owedBack(line);
  const when = new Date(line.createdAt).toLocaleString(words.locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  return (
    <li className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/admin/clients/${line.businessId}`} className="text-base font-semibold text-foreground hover:underline">
              {line.businessName || "—"}
            </Link>
            <span className="text-sm text-muted-foreground">{wordFor(words.packs, line.pack)}</span>
          </div>
          <p className="mt-1 text-sm text-foreground">
            {line.read != null ? fill(words.p.row.sent, { amount: money(line.read, words) }) : words.p.row.notRead}
            {" · "}
            {wordFor(words.plans, line.plan)} ({fill(words.p.row.price, { amount: money(line.expected, words) })})
            {" · "}
            {appName(line.app, words.lang)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            <span title={new Date(line.createdAt).toLocaleString(words.locale)}>{when}</span>
            {" · "}
            {ago(line.createdAt, now, words.lang)}
            {line.filed.bySerial === null ? null : ` · ${line.filed.bySerial ? words.p.row.bySerial : words.p.row.byAccount}`}
            {line.reference ? (
              <>
                {" · "}
                <bdi dir="ltr">{line.reference}</bdi>
              </>
            ) : null}
          </p>
          {state === "rejected_auto" && line.filed.failures.length > 0 ? (
            <p className="mt-1 text-sm text-app-danger">{checkWords(line.filed.failures[0], words)}</p>
          ) : null}
          {(state === "rejected_manual" || state === "undone") && line.reason ? <p className="mt-1 text-sm text-muted-foreground">{line.reason}</p> : null}
          {owed > 0 ? (
            <p className="mt-2 inline-flex rounded-lg bg-amber-500/10 px-2 py-1 text-sm font-medium text-amber-800 dark:text-amber-300">
              {fill(words.p.row.owed, { amount: money(owed, words) })}
            </p>
          ) : extra > 0 && line.refunded != null ? (
            <p className="mt-2 text-sm text-muted-foreground">{fill(words.p.row.refunded, { amount: money(line.refunded, words) })}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PaymentBadge state={state} words={words} />
          <Link href={`/admin/paiements/${line.id}`} className="inline-flex min-h-[40px] items-center rounded-lg px-2 text-sm text-muted-foreground hover:text-foreground">
            {words.p.row.open}
          </Link>
        </div>
      </div>
    </li>
  );
}

/* What happened to payments, newest first; with the shop and a link to each when it lists many. */
export function ActivityList({ entries, words, now, withShop }: { entries: ActivityEntry[]; words: Words; now: Date; withShop: boolean }) {
  if (entries.length === 0) return <p className="text-sm text-muted-foreground">{words.p.activity.empty}</p>;
  return (
    <ol className="space-y-3">
      {entries.map((entry) => {
        const facts = [
          entry.plan && entry.action !== "refunded" ? wordFor(words.plans, entry.plan) : null,
          entry.amount != null ? money(entry.amount, words) : null,
          entry.refund > 0 ? fill(words.p.activity.owed, { amount: money(entry.refund, words) }) : null,
          entry.until ? fill(words.p.activity.until, { date: new Date(entry.until).toLocaleDateString(words.locale) }) : null,
        ].filter(Boolean);
        return (
          <li key={`${entry.action}-${entry.id}`} className="flex gap-3">
            <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
            <span className="min-w-0 flex-1 text-[15px] text-foreground">
              {withShop && entry.businessName ? <span className="font-medium">{entry.businessName} · </span> : null}
              {words.p.activity.actions[entry.action] ?? entry.action.replace(/_/g, " ")}
              {facts.length ? <span className="text-muted-foreground"> · {facts.join(" · ")}</span> : null}
              {entry.failures.length ? <span className="block text-sm text-app-danger">{entry.failures.map((one) => checkWords(one, words)).join(" ")}</span> : null}
              {entry.reason ? <span className="block text-sm text-muted-foreground">{entry.reason}</span> : null}
              <span className="block text-sm text-muted-foreground" title={new Date(entry.at).toLocaleString(words.locale)}>
                {entry.actor === null ? words.p.activity.system : entry.actor || words.staffFallback} · {ago(entry.at, now, words.lang)}
                {withShop && entry.paymentId ? (
                  <>
                    {" · "}
                    <Link href={`/admin/paiements/${entry.paymentId}`} className="underline underline-offset-4 hover:text-foreground">
                      {words.p.activity.open}
                    </Link>
                  </>
                ) : null}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
