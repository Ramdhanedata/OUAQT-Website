"use client";

import { useState } from "react";
import { formatMoney } from "@/app-ui";
import { Button } from "@/components/ui/button";
import { wordFor, type AdminCopy, type AdminLanguage } from "./copy";

/*
 * One payment, everything needed to judge it, and two buttons.
 *
 * Confirming is the only thing in the whole system that turns money into a
 * working licence, so the screen shows what was expected beside what arrived
 * and makes the person look at the image before deciding.
 */

export type PaymentRow = {
  id: string;
  businessName: string;
  pack: string;
  launchClient: boolean;
  plan: string;
  expected: number;
  reference: string | null;
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

export function PaymentsToConfirm({ rows, words }: { rows: PaymentRow[]; words: PaymentWords }) {
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
  decision,
  onDecided,
}: {
  words: PaymentWords;
  row: PaymentRow;
  decision?: string;
  onDecided: (status: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function decide(action: "confirm" | "reject") {
    if (action === "reject" && reason.trim() === "") {
      return setError(words.t.reasonNeeded);
    }
    setBusy(true);
    setError(null);

    const response = await fetch("/api/admin/payment", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ paymentId: row.id, action, reason: reason.trim() || undefined }),
    });
    const body = await response.json().catch(() => null);
    setBusy(false);

    if (!response.ok) return setError(body?.error ?? words.t.failed);
    onDecided(body.status);
  }

  if (decision) {
    return (
      <p className="text-base text-foreground">
        {row.businessName} · {decision === "confirmed" ? words.t.confirmed : words.t.rejected}
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
        <Line label={words.t.expected} value={formatMoney(row.expected, words.lang)} />
        <Line label={words.t.plan} value={wordFor(words.plans, row.plan)} />
        <Line label={words.t.reference} value={row.reference ?? words.t.none} />
        <Line
          label={words.t.received}
          value={new Date(row.receivedAt).toLocaleString(words.locale)}
        />
      </dl>

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
        <span className="text-base text-muted-foreground">{words.t.reasonLabel}</span>
        <input
          type="text"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="mt-1 min-h-[48px] w-full rounded-lg border border-border bg-background px-4 text-base text-foreground outline-none focus:border-foreground"
        />
      </label>

      {error ? <p className="text-base text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="accent" disabled={busy} onClick={() => void decide("confirm")}>
          {words.t.confirm}
        </Button>
        <Button type="button" variant="outline" disabled={busy} onClick={() => void decide("reject")}>
          {words.t.reject}
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
