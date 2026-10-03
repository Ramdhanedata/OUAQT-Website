import { Search } from "lucide-react";
import Link from "next/link";
import { CONFIRM_COLUMNS, confirmRowsFor } from "@/builder/admin/confirm-rows";
import { paymentsCopy } from "@/builder/admin/copy-payments";
import { adminGate } from "@/builder/admin/guard";
import { AdminNav } from "@/builder/admin/nav";
import { adminWords } from "@/builder/admin/language";
import { AdminSignIn } from "@/builder/admin/sign-in";
import { loadPaymentActivity, loadPaymentLines } from "@/builder/admin/payment-history";
import { isPaymentFilter, matchesFilter, PAYMENT_FILTERS, summaryOf, type PaymentFilter } from "@/builder/admin/payment-rules";
import { ActivityList, money, PaymentListItem, type Words } from "@/builder/admin/payment-views";
import { PaymentsToConfirm } from "@/builder/admin/payments";
import { matchText } from "@/builder/admin/search-rules";
import { adminClient } from "@/builder/db/server";
import { fill } from "@/lib/utils";

/*
 * Payments: the ones a person has to handle, every payment with where it
 * stands, and everything that happened to them.
 *
 * Three views in the address (?vue=), so a reload or a link lands where it
 * was: to handle (the default: waiting for a person, or confirmed by the
 * screenshot and not looked at yet), all payments (a filter per state with
 * its count, and a search by shop, transaction or payment number), and the
 * activity (what the trail kept about payments, newest first). Above them,
 * what came in this month and since the start, what is left to handle, and
 * what is owed back to owners who paid more than the price (2026-10-03).
 *
 * The overview at /admin counts the payments to handle first of everything
 * it shows and links here. Everything is read here, on the server, with the
 * service role. The browser is handed what it needs to draw the screen and
 * a short-lived link to each image, never a key.
 */

type View = "traiter" | "tous" | "activite";
type Props = { searchParams: Promise<{ vue?: string; f?: string; q?: string }> };

export default async function PaymentsPage(props: Props) {
  const gate = await adminGate();
  const { lang, t, locale } = await adminWords();
  if (!gate.allowed) return <AdminSignIn reason={gate.reason} />;

  const supabase = adminClient();
  if (!supabase) {
    return <p className="text-base text-foreground">{t.noDatabase}</p>;
  }

  const p = paymentsCopy[lang];
  const words: Words = { p, plans: t.plans, packs: t.packs, lang, locale, staffFallback: t.staffFallback };
  const params = await props.searchParams;
  const view: View = params.vue === "tous" || params.vue === "activite" ? params.vue : "traiter";
  const filter = isPaymentFilter(params.f) ? params.f : null;
  const typed = (params.q ?? "").trim().slice(0, 80);
  const now = new Date();

  const lines = await loadPaymentLines(supabase);
  const summary = summaryOf(lines, now);

  /* Only what the open view needs: the cards to decide, or the activity. */
  const toHandle = view === "traiter" ? await rowsToHandle() : [];
  const activity = view === "activite" ? await loadPaymentActivity(supabase) : [];
  const confirmWords = { t: t.payments, packs: words.packs, plans: words.plans, lang, locale };

  const href = (next: { vue?: View; f?: PaymentFilter | null; q?: string }) => {
    const query = new URLSearchParams();
    const v = next.vue ?? view;
    if (v !== "traiter") query.set("vue", v);
    const f = next.f === undefined ? filter : next.f;
    if (v === "tous" && f) query.set("f", f);
    const q = next.q ?? typed;
    if (v === "tous" && q) query.set("q", q);
    const text = query.toString();
    return `/admin/paiements${text ? `?${text}` : ""}`;
  };

  return (
    <>
      <AdminNav current="/admin/paiements" staff={gate.staff.name ?? t.staffFallback} here={href({})} />
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">{p.title}</h1>
      <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">{p.intro}</p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Figure label={p.figures.month} value={money(summary.monthAmount, words)} sub={fill(p.figures.monthSub, { count: summary.monthCount })} />
        <Figure label={p.figures.all} value={money(summary.allAmount, words)} sub={p.figures.allSub} />
        <Figure label={p.figures.toHandle} value={String(summary.toHandle)} sub={p.figures.toHandleSub} strong={summary.toHandle > 0} />
        <Figure
          label={p.figures.refunds}
          value={money(summary.refundAmount, words)}
          sub={fill(p.figures.refundsSub, { count: summary.refundCount })}
          strong={summary.refundCount > 0}
        />
      </ul>

      <nav aria-label={p.title} className="mt-8 flex flex-wrap gap-1 border-b border-border">
        {(["traiter", "tous", "activite"] as const).map((one) => {
          const on = one === view;
          const label = one === "traiter" ? p.views.handle : one === "tous" ? p.views.all : p.views.activity;
          const count = one === "traiter" ? summary.toHandle : one === "tous" ? lines.length : null;
          return (
            <Link
              key={one}
              href={href({ vue: one, f: null, q: "" })}
              aria-current={on ? "page" : undefined}
              className={`-mb-px inline-flex min-h-[44px] items-center gap-2 border-b-2 px-4 text-sm ${
                on ? "border-foreground font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
              {count !== null ? <span className="tabular-nums text-muted-foreground">{count}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6">
        {view === "traiter" ? (
          <>
            <PaymentsToConfirm rows={toHandle.filter((row) => row.status !== "confirmed")} words={confirmWords} />
            {toHandle.some((row) => row.status === "confirmed") ? (
              <>
                <h2 className="mb-2 mt-12 text-xl font-semibold text-foreground">{t.payments.automaticTitle}</h2>
                <p className="mb-6 text-base leading-relaxed text-muted-foreground">{t.payments.automaticIntro}</p>
                <PaymentsToConfirm rows={toHandle.filter((row) => row.status === "confirmed")} words={confirmWords} review />
              </>
            ) : null}
          </>
        ) : view === "tous" ? (
          allPayments()
        ) : (
          <ActivityList entries={activity} words={words} now={now} withShop />
        )}
      </div>
    </>
  );

  /* Waiting for a person first, then the ones the screenshot confirmed alone, to look at. */
  async function rowsToHandle() {
    if (!supabase) return [];
    const [{ data: waiting }, { data: automatic }] = await Promise.all([
      supabase
        .from("payments")
        .select(CONFIRM_COLUMNS)
        .in("status", ["submitted", "pending_confirmation"])
        .order("created_at", { ascending: true })
        .limit(50),
      /* Confirmed alone because the screenshot matched (0022), not yet looked at. */
      supabase
        .from("payments")
        .select(CONFIRM_COLUMNS)
        .eq("status", "confirmed")
        .eq("auto_confirmed", true)
        .is("reviewed_at", null)
        .order("created_at", { ascending: true })
        .limit(50),
    ]);
    return confirmRowsFor(supabase, [...(waiting ?? []), ...(automatic ?? [])]);
  }

  /* Every payment, filtered by where it stands and found by shop, transaction or number. */
  function allPayments() {
    const searched = lines.filter(
      (line) =>
        !typed ||
        matchText(line.businessName, typed) ||
        (line.reference ?? "").toLowerCase().includes(typed.toLowerCase()) ||
        line.id.startsWith(typed.toLowerCase())
    );
    const shown = filter ? searched.filter((line) => matchesFilter(filter, line)) : searched;
    return (
      <>
        <nav aria-label={p.views.all} className="flex flex-wrap gap-2">
          {[null, ...PAYMENT_FILTERS].map((one) => {
            const count = one ? searched.filter((line) => matchesFilter(one, line)).length : searched.length;
            if (one && count === 0 && one !== filter) return null;
            const on = one === filter;
            return (
              <Link
                key={one ?? "all"}
                href={href({ f: one })}
                aria-current={on ? "page" : undefined}
                className={`inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 text-sm ${
                  on ? "border-foreground bg-foreground text-background" : "border-border text-foreground hover:border-foreground/40"
                }`}
              >
                {p.filters[one ?? "all"]}
                <span className={`tabular-nums ${on ? "text-background/80" : "text-muted-foreground"}`}>{count}</span>
              </Link>
            );
          })}
        </nav>

        <form action="/admin/paiements" className="mt-4 flex max-w-xl gap-2">
          <input type="hidden" name="vue" value="tous" />
          {filter ? <input type="hidden" name="f" value={filter} /> : null}
          <label className="relative flex-1">
            <span className="sr-only">{p.search}</span>
            <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              defaultValue={typed}
              placeholder={p.search}
              className="min-h-[44px] w-full rounded-lg border border-border bg-surface pe-3 ps-9 text-sm text-foreground outline-none focus:border-foreground"
            />
          </label>
          <button type="submit" className="min-h-[44px] rounded-lg bg-foreground px-4 text-sm font-medium text-background">
            {p.searchButton}
          </button>
          {typed ? (
            <Link href={href({ q: "" }).replace(/([?&])q=[^&]*&?/, "$1").replace(/[?&]$/, "")} className="inline-flex min-h-[44px] items-center px-2 text-sm text-muted-foreground hover:text-foreground">
              {p.clear}
            </Link>
          ) : null}
        </form>

        {lines.length === 0 ? (
          <p className="mt-6 text-base text-muted-foreground">{p.empty}</p>
        ) : shown.length === 0 ? (
          <p className="mt-6 text-base text-muted-foreground">{p.emptyFilter}</p>
        ) : (
          <>
            <ul className="mt-6 space-y-3">
              {shown.map((line) => (
                <PaymentListItem key={line.id} line={line} words={words} now={now} />
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">{fill(p.showing, { count: lines.length })}</p>
          </>
        )}
      </>
    );
  }
}

function Figure({ label, value, sub, strong = false }: { label: string; value: string; sub: string; strong?: boolean }) {
  return (
    <li className={`rounded-2xl border bg-surface p-5 ${strong ? "border-foreground/40" : "border-border"}`}>
      <span className="block text-sm text-muted-foreground">{label}</span>
      <span className="mt-2 block truncate text-2xl font-semibold tracking-tight text-foreground">{value}</span>
      <span className="mt-1 block truncate text-sm text-muted-foreground">{sub}</span>
    </li>
  );
}
