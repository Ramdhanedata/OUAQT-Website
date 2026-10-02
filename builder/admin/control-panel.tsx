"use client";

import { Ban, CalendarPlus, ChevronDown, Gift, PauseCircle, PlayCircle, ShieldBan, TimerOff, Wallet, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ControlAction } from "./control-rules";
import type { GrowthCopy } from "./copy-growth";

/*
 * One shop's controls on the Contrôle page: the actions its state allows,
 * in three groups (give access, end, sanction). Each opens a short form
 * that says what will happen, asks for the reason kept in the history, and
 * a number of days or a plan where one is needed, before anything is sent.
 */

type Words = GrowthCopy["control"];

const SECTIONS: { key: "access" | "stop" | "sanction"; actions: ControlAction[] }[] = [
  { key: "access", actions: ["gift", "grant", "extend"] },
  { key: "stop", actions: ["stop_trial", "cancel"] },
  { key: "sanction", actions: ["suspend", "reactivate", "ban", "unban"] },
];

const ICONS: Record<ControlAction, LucideIcon> = {
  gift: Gift,
  grant: Wallet,
  extend: CalendarPlus,
  stop_trial: TimerOff,
  cancel: Ban,
  suspend: PauseCircle,
  reactivate: PlayCircle,
  ban: ShieldBan,
  unban: PlayCircle,
};

/* The ones that take something away get the warning colour. */
const HARSH: ControlAction[] = ["stop_trial", "cancel", "suspend", "ban"];

/* The page's action names onto the licence route's. */
function requestFor(action: ControlAction, businessId: string, reason: string, extra: { days: number; plan: string }) {
  switch (action) {
    case "stop_trial":
      return { action: "cancel", businessId, reason };
    case "extend":
      return { action: "extend", businessId, reason, days: extra.days };
    case "grant":
      return { action: "grant", businessId, reason, plan: extra.plan };
    default:
      return { action, businessId, reason };
  }
}

export function ControlPanel({ t, businessId, actions }: { t: Words; businessId: string; actions: ControlAction[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<ControlAction | null>(null);
  const [reason, setReason] = useState("");
  const [days, setDays] = useState("30");
  const [plan, setPlan] = useState("annual");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function pick(action: ControlAction) {
    setChosen(action);
    setReason("");
    setMessage(null);
  }

  async function confirm() {
    if (!chosen) return;
    const count = Number(days);
    if (reason.trim().length < 4 || (chosen === "extend" && !(Number.isInteger(count) && count >= 1))) {
      return setMessage({ ok: false, text: t.errors.invalid });
    }
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/admin/licence", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(requestFor(chosen, businessId, reason.trim(), { days: count, plan })),
    }).catch(() => null);
    setBusy(false);
    const answer = (await response?.json().catch(() => ({}))) as { error?: string } | undefined;
    if (!response?.ok) return setMessage({ ok: false, text: t.errors[answer?.error ?? "failed"] ?? t.errors.failed });
    setMessage({ ok: true, text: t.done });
    setChosen(null);
    router.refresh();
  }

  const button = (action: ControlAction) => {
    const Icon = ICONS[action];
    const on = chosen === action;
    const harsh = HARSH.includes(action);
    return (
      <button
        key={action}
        type="button"
        aria-pressed={on}
        onClick={() => pick(action)}
        className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-3.5 text-sm font-medium transition-colors ${
          on
            ? harsh
              ? "border-app-danger bg-app-danger-soft text-app-danger"
              : "border-foreground bg-foreground text-background"
            : harsh
              ? "border-app-danger/40 text-app-danger hover:border-app-danger"
              : "border-border text-foreground hover:border-foreground/40"
        }`}
      >
        <Icon aria-hidden className="h-4 w-4" />
        {t.actions[action].label}
      </button>
    );
  };

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          setChosen(null);
          setMessage(null);
        }}
        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:border-foreground/40"
      >
        {open ? t.close : t.manage}
        <ChevronDown aria-hidden className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="mt-4 space-y-4 rounded-xl border border-border bg-background p-4">
          {SECTIONS.map((section) => {
            const here = section.actions.filter((action) => actions.includes(action));
            if (!here.length) return null;
            return (
              <div key={section.key}>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.sections[section.key]}</p>
                <div className="flex flex-wrap gap-2">{here.map(button)}</div>
              </div>
            );
          })}

          {chosen ? (
            <form
              className="space-y-3 border-t border-border pt-4"
              onSubmit={(event) => {
                event.preventDefault();
                void confirm();
              }}
            >
              <p className="text-sm leading-relaxed text-foreground">{t.actions[chosen].hint}</p>
              {chosen === "extend" ? (
                <div className="flex flex-wrap items-end gap-2">
                  {[7, 15, 30, 90].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDays(String(preset))}
                      className={`min-h-[40px] rounded-lg border px-3 text-sm ${days === String(preset) ? "border-foreground font-medium" : "border-border text-muted-foreground"}`}
                    >
                      +{preset}
                    </button>
                  ))}
                  <label className="block">
                    <span className="text-xs text-muted-foreground">{t.days}</span>
                    <input
                      dir="ltr"
                      inputMode="numeric"
                      value={days}
                      onChange={(event) => setDays(event.target.value.replace(/\D/g, ""))}
                      className="mt-1 block min-h-[40px] w-24 rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-foreground"
                    />
                  </label>
                </div>
              ) : null}
              {chosen === "grant" ? (
                <label className="block">
                  <span className="text-xs text-muted-foreground">{t.plan}</span>
                  <select
                    value={plan}
                    onChange={(event) => setPlan(event.target.value)}
                    className="mt-1 block min-h-[44px] rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-foreground"
                  >
                    {Object.entries(t.planNames).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className="block">
                <span className="text-xs text-muted-foreground">{t.reason}</span>
                <textarea
                  value={reason}
                  maxLength={400}
                  rows={2}
                  onChange={(event) => setReason(event.target.value)}
                  className="mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-foreground"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={busy || reason.trim().length < 4}
                  className={`min-h-[44px] rounded-lg px-4 text-sm font-medium disabled:opacity-50 ${
                    HARSH.includes(chosen) ? "bg-app-danger text-white" : "bg-foreground text-background"
                  }`}
                >
                  {t.actions[chosen].confirm}
                </button>
                <button type="button" onClick={() => setChosen(null)} className="min-h-[44px] rounded-lg px-4 text-sm text-muted-foreground hover:text-foreground">
                  {t.cancelAction}
                </button>
              </div>
            </form>
          ) : null}

          {message ? <p className={`text-sm ${message.ok ? "font-medium text-app-success" : "text-destructive"}`}>{message.text}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
