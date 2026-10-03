"use client";

import { useState } from "react";
import { formatMoney, toMinor } from "@/app-ui";
import { appName, type PaymentApp } from "@/builder/payment/apps";
import type { Extracted } from "@/builder/payment/checks";
import { Button } from "@/components/ui/button";
import { wordFor, type AdminCopy, type AdminLanguage } from "./copy";

/*
 * One payment, everything needed to judge it, and two buttons.
 *
 * Confirming is the only thing in the whole system that turns money into a
 * working licence, so the screen shows what was expected beside what arrived
 * and makes the person look at the image before deciding. When the AI read
 * the screenshot, what it read is shown too, to be checked against the image
 * rather than believed.
 */

export type PaymentRow = {
  id: string;
  businessName: string;
  pack: string;
  launchClient: boolean;
  plan: string;
  /* The lengths a person may grant instead, with their price; empty when there is no choice. */
  choices: { plan: string; amount: number }[];
  app: PaymentApp;
  expected: number;
  reference: string | null;
  /* What was read off the screenshot, or null when nothing read it. */
  extracted: Extracted;
  status: string;
  receivedAt: string;
  screenshotUrl: string | null;
};

/* What this screen needs to speak the reader's language. */
export type PaymentWords = {
  t: AdminCopy["payments"];
  packs: Record<string, string>;
  plans: Record<string, string>;
  lang: AdminLanguage;
  locale: string;
};

/*
 * `review` is the list of payments confirmed automatically: the choice there
 * is to keep one, or to undo it, which takes the licence back.
 */
export function PaymentsToConfirm({ rows, words, review = false }: { rows: PaymentRow[]; words: PaymentWords; review?: boolean }) {
  const [decided, setDecided] = useState<Record<string, string>>({});

  if (rows.length === 0) {
    return (
      <p className="text-base leading-relaxed text-muted-foreground">
        {words.t.empty}
      </p>
    );
  }

  return (
    <ul className="space-y-8">
      {rows.map((row) => (
        <li key={row.id} className="rounded-2xl border border-border p-4 sm:p-6">
          <Payment
            words={words}
            row={row}
            review={review}
            decision={decided[row.id]}
            onDecided={(status) => setDecided((all) => ({ ...all, [row.id]: status }))}
          />
        </li>
      ))}
    </ul>
  );
}

function Payment({
  words,
  row,
  review,
  decision,
  onDecided,
}: {
  words: PaymentWords;
  row: PaymentRow;
  review: boolean;
  decision?: string;
  onDecided: (status: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  /*
   * A year or six months. Filed as what its amount paid for, or as a year
   * when nothing could be read: the person looking at the image says which.
   */
  const [plan, setPlan] = useState(row.plan);
  const choosing = !review && row.choices.length > 1;
  const expected = row.choices.find((one) => one.plan === plan)?.amount ?? row.expected;
  /* More on the image than the price of what is granted: the owner was told to ask for it back. */
  const readAmount = row.extracted?.amountMru != null ? toMinor(row.extracted.amountMru) : null;
  const refund = readAmount != null && readAmount > expected ? readAmount - expected : 0;

  async function decide(action: "confirm" | "reject" | "keep" | "undo") {
    if ((action === "reject" || action === "undo") && reason.trim() === "") {
      return setError(words.t.reasonNeeded);
    }
    setBusy(true);
    setError(null);

    const response = await fetch("/api/admin/payment", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        paymentId: row.id,
        action,
        reason: reason.trim() || undefined,
        plan: action === "confirm" && choosing ? plan : undefined,
      }),
    });
    const body = await response.json().catch(() => null);
    setBusy(false);

    if (!response.ok) return setError(body?.error ?? words.t.failed);
    onDecided(body.status);
  }

  if (decision) {
    return (
      <p className="text-base text-foreground">
        {row.businessName} · {decision === "confirmed" ? (review ? words.t.kept : words.t.confirmed) : words.t.rejected}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-lg font-medium text-foreground">{row.businessName}</span>
        <span className="text-base text-muted-foreground">
          {wordFor(words.packs, row.pack)}
          {row.launchClient ? ` · ${words.t.launch}` : ""}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
        <Line label={words.t.expected} value={formatMoney(expected, words.lang)} />
        <Line label={words.t.plan} value={wordFor(words.plans, row.plan)} />
        <Line label={words.t.app} value={appName(row.app, words.lang)} />
        <Line label={words.t.reference} value={row.reference ?? words.t.none} />
        <Line
          label={words.t.received}
          value={new Date(row.receivedAt).toLocaleString(words.locale)}
        />
        {row.extracted ? (
          <>
            <Line
              label={words.t.readAmount}
              value={row.extracted.amountMru != null ? formatMoney(toMinor(row.extracted.amountMru), words.lang) : words.t.none}
            />
            <Line label={words.t.readDate} value={row.extracted.date ?? words.t.none} />
            <Line label={words.t.readRecipient} value={row.extracted.recipient ?? words.t.none} />
            {refund > 0 ? <Line label={words.t.refundDue} value={formatMoney(refund, words.lang)} /> : null}
          </>
        ) : null}
      </dl>

      {row.extracted ? null : <p className="text-base text-muted-foreground">{words.t.notRead}</p>}

      {choosing ? (
        <div role="group" aria-label={words.t.grantFor}>
          <p className="text-base text-muted-foreground">{words.t.grantFor}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            {row.choices.map((one) => (
              <Button
                key={one.plan}
                type="button"
                variant={one.plan === plan ? "accent" : "outline"}
                aria-pressed={one.plan === plan}
                onClick={() => setPlan(one.plan)}
              >
                {wordFor(words.plans, one.plan)} · {formatMoney(one.amount, words.lang)}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      {row.screenshotUrl ? (
        <a href={row.screenshotUrl} target="_blank" rel="noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={row.screenshotUrl}
            alt={words.t.screenshotAlt}
            className="max-h-80 rounded-lg border border-border object-contain"
          />
        </a>
      ) : (
        <p className="text-base text-destructive">{words.t.noScreenshot}</p>
      )}

      <label className="block">
        <span className="text-base text-muted-foreground">{review ? words.t.undoReasonLabel : words.t.reasonLabel}</span>
        <input
          type="text"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="mt-1 min-h-[48px] w-full rounded-lg border border-border bg-background px-4 text-base text-foreground outline-none focus:border-foreground"
        />
      </label>

      {error ? <p className="text-base text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="accent" disabled={busy} onClick={() => void decide(review ? "keep" : "confirm")}>
          {review ? words.t.keep : words.t.confirm}
        </Button>
        <Button type="button" variant="outline" disabled={busy} onClick={() => void decide(review ? "undo" : "reject")}>
          {review ? words.t.undo : words.t.reject}
        </Button>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-base text-muted-foreground">{label}</dt>
      <dd className="text-base text-foreground">
        <bdi dir="ltr">{value}</bdi>
      </dd>
    </div>
  );
}
