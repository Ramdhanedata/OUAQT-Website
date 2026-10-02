"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fill } from "@/lib/utils";
import type { GrowthCopy } from "./copy-growth";

/*
 * The representatives' forms: adding one, their bonus and details, turning
 * them off and on, recording what they were paid, copying their link, and
 * crediting a shop to one from the shop's page. Each posts to
 * /api/admin/reps and refreshes the page it is on.
 */

type Words = GrowthCopy["reps"];

const input =
  "mt-2 min-h-[48px] w-full rounded-lg border border-border bg-background px-4 text-base text-foreground outline-none focus:border-foreground";
const primary = "min-h-[48px] rounded-lg bg-foreground px-5 text-base font-medium text-background disabled:opacity-50";
const secondary = "inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:border-foreground/40 disabled:opacity-50";

async function post(body: unknown): Promise<{ ok: boolean; error?: string; code?: string; id?: string }> {
  const response = await fetch("/api/admin/reps", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);
  if (!response) return { ok: false, error: "failed" };
  const answer = (await response.json().catch(() => ({}))) as { error?: string; code?: string; id?: string };
  return response.ok ? { ok: true, ...answer } : { ok: false, error: answer.error ?? "failed" };
}

/* A typed amount: "1 500,50" and "1500.5" both mean one thousand five hundred and a half. */
function amountOf(text: string): number {
  const value = Number(text.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(value) && value >= 0 ? value : NaN;
}

type Details = { name: string; phone: string; percent: string; perShop: string; note: string };

function DetailFields({ t, value, onChange }: { t: Words; value: Details; onChange: (next: Details) => void }) {
  const set = (key: keyof Details) => (event: { target: { value: string } }) => onChange({ ...value, [key]: event.target.value });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block">
        <span className="text-base font-medium text-foreground">{t.name}</span>
        <input className={input} value={value.name} maxLength={80} required onChange={set("name")} />
      </label>
      <label className="block">
        <span className="text-base font-medium text-foreground">{t.phone}</span>
        <input className={input} dir="ltr" inputMode="tel" value={value.phone} maxLength={30} onChange={set("phone")} />
      </label>
      <label className="block">
        <span className="text-base font-medium text-foreground">{t.percent}</span>
        <input className={input} dir="ltr" inputMode="decimal" value={value.percent} onChange={set("percent")} />
        <span className="mt-1 block text-sm text-muted-foreground">{t.percentHint}</span>
      </label>
      <label className="block">
        <span className="text-base font-medium text-foreground">{t.perShop}</span>
        <input className={input} dir="ltr" inputMode="decimal" value={value.perShop} onChange={set("perShop")} />
        <span className="mt-1 block text-sm text-muted-foreground">{t.perShopHint}</span>
      </label>
      <label className="block sm:col-span-2">
        <span className="text-base font-medium text-foreground">{t.note}</span>
        <input className={input} value={value.note} maxLength={500} onChange={set("note")} />
      </label>
    </div>
  );
}

function detailsBody(value: Details) {
  const percent = amountOf(value.percent || "0");
  const perShop = amountOf(value.perShop || "0");
  if (!value.name.trim() || Number.isNaN(percent) || percent > 100 || Number.isNaN(perShop)) return null;
  return { name: value.name.trim(), phone: value.phone.trim() || undefined, percent, perShop, note: value.note.trim() || undefined };
}

export function RepCreateForm({ t }: { t: Words }) {
  const router = useRouter();
  const empty: Details = { name: "", phone: "", percent: "10", perShop: "0", note: "" };
  const [value, setValue] = useState<Details>(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function save() {
    setError(null);
    setDone(null);
    const details = detailsBody(value);
    if (!details) return setError(t.errors.invalid);
    setBusy(true);
    const answer = await post({ action: "create", ...details });
    setBusy(false);
    if (!answer.ok) return setError(t.errors[answer.error ?? "failed"] ?? t.errors.failed);
    setDone(fill(t.added, { name: details.name, code: answer.code ?? "" }));
    setValue(empty);
    router.refresh();
  }

  return (
    <form
      className="space-y-4 rounded-2xl border border-border bg-surface p-5 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <div>
        <h2 className="text-xl font-semibold text-foreground">{t.addTitle}</h2>
        <p className="mt-1 text-base text-muted-foreground">{t.addIntro}</p>
      </div>
      <DetailFields t={t} value={value} onChange={setValue} />
      <button type="submit" disabled={busy || !value.name.trim()} className={primary}>
        {t.add}
      </button>
      {error ? <p className="text-base text-destructive">{error}</p> : null}
      {done ? <p className="text-base font-medium text-app-success">{done}</p> : null}
    </form>
  );
}

export function RepEditForm({ t, id, initial }: { t: Words; id: string; initial: Details }) {
  const router = useRouter();
  const [value, setValue] = useState<Details>(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    setMessage(null);
    const details = detailsBody(value);
    if (!details) return setMessage({ ok: false, text: t.errors.invalid });
    setBusy(true);
    const answer = await post({ action: "update", id, ...details });
    setBusy(false);
    setMessage(answer.ok ? { ok: true, text: t.saved } : { ok: false, text: t.errors[answer.error ?? "failed"] ?? t.errors.failed });
    if (answer.ok) router.refresh();
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <DetailFields t={t} value={value} onChange={setValue} />
      <button type="submit" disabled={busy || !value.name.trim()} className={primary}>
        {t.save}
      </button>
      {message ? <p className={`text-base ${message.ok ? "font-medium text-app-success" : "text-destructive"}`}>{message.text}</p> : null}
    </form>
  );
}

export function RepActiveButton({ t, id, active }: { t: Words; id: string; active: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        type="button"
        disabled={busy}
        className={secondary}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const answer = await post({ action: "active", id, active: !active });
          setBusy(false);
          if (!answer.ok) return setError(t.errors[answer.error ?? "failed"] ?? t.errors.failed);
          router.refresh();
        }}
      >
        {active ? t.deactivate : t.reactivate}
      </button>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

export function PayoutForm({ t, id }: { t: Words; id: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    setMessage(null);
    const value = amountOf(amount);
    if (!(value > 0)) return setMessage({ ok: false, text: t.errors.invalid });
    setBusy(true);
    const answer = await post({ action: "payout", id, amount: value, note: note.trim() || undefined });
    setBusy(false);
    if (!answer.ok) return setMessage({ ok: false, text: t.errors[answer.error ?? "failed"] ?? t.errors.failed });
    setMessage({ ok: true, text: t.payoutSaved });
    setAmount("");
    setNote("");
    router.refresh();
  }

  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-foreground">{t.payoutAmount}</span>
          <input className={input} dir="ltr" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-foreground">{t.payoutNote}</span>
          <input className={input} value={note} maxLength={200} onChange={(event) => setNote(event.target.value)} />
        </label>
      </div>
      <button type="submit" disabled={busy || !amount.trim()} className={primary}>
        {t.payoutAdd}
      </button>
      {message ? <p className={`text-sm ${message.ok ? "font-medium text-app-success" : "text-destructive"}`}>{message.text}</p> : null}
    </form>
  );
}

export function CopyLink({ t, link }: { t: Words; link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={secondary}
      onClick={() => {
        void navigator.clipboard?.writeText(link).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000); // not-a-rule: how long "copied" shows
        });
      }}
    >
      {copied ? t.copied : t.copyLink}
    </button>
  );
}

export function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" className={`${secondary} print:hidden`} onClick={() => window.print()}>
      {label}
    </button>
  );
}

/* On a shop's page: which representative brought it, changed by hand. */
export function AssignRep({
  t,
  businessId,
  current,
  reps,
}: {
  t: Words;
  businessId: string;
  current: string | null;
  reps: { id: string; name: string; code: string; active: boolean }[];
}) {
  const router = useRouter();
  const [chosen, setChosen] = useState(current ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setMessage(null);
        const answer = await post({ action: "assign", businessId, id: chosen || null });
        setBusy(false);
        setMessage(answer.ok ? { ok: true, text: t.assignSaved } : { ok: false, text: t.errors[answer.error ?? "failed"] ?? t.errors.failed });
        if (answer.ok) router.refresh();
      }}
    >
      <p className="text-sm text-muted-foreground">{t.assignHint}</p>
      <div className="flex flex-wrap items-end gap-3">
        <select className={`${input} mt-0 w-auto min-w-[220px]`} value={chosen} onChange={(event) => setChosen(event.target.value)}>
          <option value="">{t.assignNone}</option>
          {reps
            .filter((one) => one.active || one.id === current)
            .map((one) => (
              <option key={one.id} value={one.id}>
                {one.name} · {one.code}
              </option>
            ))}
        </select>
        <button type="submit" disabled={busy || chosen === (current ?? "")} className={secondary}>
          {t.assignSave}
        </button>
      </div>
      {message ? <p className={`text-sm ${message.ok ? "font-medium text-app-success" : "text-destructive"}`}>{message.text}</p> : null}
    </form>
  );
}
