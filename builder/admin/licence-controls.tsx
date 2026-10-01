"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fill } from "@/lib/utils";
import type { AdminCopy } from "./copy";

/*
 * What staff can decide about one shop's licence: renew it, move its end
 * date, end it today, suspend it, or lift a suspension.
 *
 * Nothing happens on the first press. Each one opens a short form that says
 * what will happen in plain words and asks for a reason, and only its own
 * button, which names the shop, does it. The reason goes to the trail with
 * the person who gave it.
 */

type Mode = "grant" | "setEnd" | "end" | "suspend" | "reactivate";
const PLANS = ["annual", "semiannual", "quarterly", "perpetual"] as const;

const PRIMARY = "min-h-[44px] rounded-lg bg-foreground px-4 text-[15px] font-medium text-background";
const QUIET = "min-h-[44px] rounded-lg border border-border bg-surface px-4 text-[15px] text-foreground hover:border-foreground";
const DANGER = "min-h-[44px] rounded-lg border border-app-danger/50 px-4 text-[15px] text-app-danger hover:bg-app-danger-soft";

export type LicenceControlWords = {
  t: AdminCopy["client"];
  plans: Record<string, string>;
  locale: string;
};

export function LicenceControls({
  businessId,
  businessName,
  suspended,
  hasLicence,
  perpetual,
  endsAt,
  graceDays,
  words,
}: {
  businessId: string;
  businessName: string;
  suspended: boolean;
  hasLicence: boolean;
  /* A permanent licence has no end date to move or to bring forward. */
  perpetual: boolean;
  endsAt: string | null;
  graceDays: number;
  words: LicenceControlWords;
}) {
  const { t } = words;
  const router = useRouter();
  const [mode, setMode] = useState<Mode | null>(null);
  const [plan, setPlan] = useState<(typeof PLANS)[number]>("annual");
  const [reason, setReason] = useState("");
  const [endsOn, setEndsOn] = useState((endsAt ?? new Date().toISOString()).slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  function open(next: Mode | null) {
    setMode(next);
    setReason("");
    setError(null);
    setDone(null);
  }

  async function send() {
    if (!mode) return;
    if (reason.trim().length < 4) return setError(t.reasonNeeded);
    setBusy(true);
    setError(null);
    const response = await fetch("/api/admin/licence", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(
        mode === "grant"
          ? { action: "grant", businessId, plan, reason: reason.trim() }
          : mode === "setEnd"
            ? { action: "set_end", businessId, endsOn, reason: reason.trim() }
            : { action: mode, businessId, reason: reason.trim() }
      ),
    }).catch(() => null);
    setBusy(false);
    const answer = response?.ok ? ((await response.json()) as { endsAt?: string | null }) : null;
    if (!answer) return setError(t.failed);

    const date = answer.endsAt ? new Date(answer.endsAt).toLocaleDateString(words.locale) : "";
    setDone(
      mode === "suspend"
        ? t.suspendedDone
        : mode === "reactivate"
          ? t.reactivatedDone
          : mode === "end"
            ? t.endDone
            : mode === "setEnd"
              ? fill(t.setEndDone, { date })
              : answer.endsAt
                ? fill(t.grantedUntil, { date })
                : t.grantedForever
    );
    setMode(null);
    setReason("");
    /* The page above is drawn on the server: ask it again so the status and the trail show the change. */
    router.refresh();
  }

  const form =
    mode === "grant"
      ? { intro: t.grantIntro, label: t.grantReason, button: t.grantConfirm, danger: false }
      : mode === "setEnd"
        ? { intro: t.setEndIntro, label: t.setEndReason, button: t.setEndConfirm, danger: false }
        : mode === "end"
          ? { intro: fill(t.endIntro, { grace: graceDays }), label: t.endReason, button: fill(t.endConfirm, { name: businessName }), danger: true }
          : mode === "suspend"
        ? { intro: t.suspendIntro, label: t.suspendReason, button: fill(t.suspendConfirm, { name: businessName }), danger: true }
        : mode === "reactivate"
          ? { intro: t.reactivateIntro, label: t.reactivateReason, button: fill(t.reactivateConfirm, { name: businessName }), danger: false }
          : null;

  return (
    <div className="space-y-4">
      {!mode ? (
        <div className="flex flex-wrap gap-3">
          {suspended ? (
            <button type="button" onClick={() => open("reactivate")} className={PRIMARY}>
              {t.reactivate}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => open("grant")}
            className={suspended ? QUIET : PRIMARY}
          >
            {t.grant}
          </button>
          {hasLicence && !perpetual ? (
            <button type="button" onClick={() => open("setEnd")} className={QUIET}>
              {t.setEnd}
            </button>
          ) : null}
          {hasLicence && !perpetual ? (
            <button type="button" onClick={() => open("end")} className={DANGER}>
              {t.end}
            </button>
          ) : null}
          {!suspended && hasLicence ? (
            <button type="button" onClick={() => open("suspend")} className={DANGER}>
              {t.suspend}
            </button>
          ) : null}
        </div>
      ) : null}

      {form ? (
        <div className={`space-y-4 rounded-lg border-2 p-4 ${form.danger ? "border-app-danger" : "border-foreground"}`}>
          <p className="max-w-2xl text-base leading-relaxed text-foreground">{form.intro}</p>

          {mode === "grant" ? (
            <fieldset>
              <legend className="text-base font-medium text-foreground">{t.grantPlan}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {PLANS.map((one) => (
                  <label
                    key={one}
                    className={`inline-flex min-h-[44px] cursor-pointer items-center rounded-full border px-4 text-base ${
                      plan === one ? "border-foreground bg-foreground text-background" : "border-border text-foreground"
                    }`}
                  >
                    <input type="radio" name="plan" value={one} checked={plan === one} onChange={() => setPlan(one)} className="sr-only" />
                    {words.plans[one] ?? one}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          {mode === "setEnd" ? (
            <label className="block">
              <span className="block text-base font-medium text-foreground">{t.setEndDate}</span>
              <input
                type="date"
                value={endsOn}
                onChange={(event) => setEndsOn(event.target.value)}
                className="mt-2 min-h-[48px] rounded-lg border border-border bg-background px-4 text-base text-foreground outline-none focus:border-foreground"
              />
            </label>
          ) : null}

          <label className="block">
            <span className="text-base font-medium text-foreground">{form.label}</span>
            <input
              type="text"
              value={reason}
              autoFocus={mode !== "setEnd"}
              maxLength={400}
              onChange={(event) => setReason(event.target.value)}
              className="mt-2 min-h-[48px] w-full rounded-lg border border-border bg-background px-4 text-base text-foreground outline-none focus:border-foreground"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void send()}
              className={`min-h-[48px] rounded-lg px-5 text-base font-medium text-background disabled:opacity-50 ${
                form.danger ? "bg-app-danger" : "bg-foreground"
              }`}
            >
              {form.button}
            </button>
            <button
              type="button"
              onClick={() => open(null)}
              className="min-h-[48px] rounded-lg border border-border px-5 text-base text-foreground"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="text-base text-destructive">{error}</p> : null}
      {done ? <p className="text-base font-medium text-app-success">{done}</p> : null}
    </div>
  );
}
