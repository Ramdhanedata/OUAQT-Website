"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fill } from "@/lib/utils";
import type { AdminCopy } from "./copy";

/*
 * The Team page's two pieces: the form that adds someone or sets a new
 * password, and the buttons beside each member.
 *
 * The password is typed here by the person it belongs to, checked twice, and
 * sent once to the server, which hands it to Supabase. It never comes back.
 */

type Words = AdminCopy["staff"];

const input =
  "mt-2 min-h-[48px] w-full rounded-lg border border-border bg-background px-4 text-base text-foreground outline-none focus:border-foreground";

async function post(body: unknown): Promise<{ ok: boolean; error?: string; login?: string; existed?: boolean }> {
  const response = await fetch("/api/admin/staff", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);
  if (!response) return { ok: false, error: "failed" };
  const answer = (await response.json().catch(() => ({}))) as { error?: string; login?: string; existed?: boolean };
  return response.ok ? { ok: true, ...answer } : { ok: false, error: answer.error ?? "failed" };
}

export function StaffForm({ t }: { t: Words }) {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function save() {
    setError(null);
    setDone(null);
    if (password !== again) return setError(t.errors.mismatch);
    setBusy(true);
    const answer = await post({ action: "save", login, name: name || undefined, password });
    setBusy(false);
    if (!answer.ok) return setError(t.errors[answer.error ?? "failed"] ?? t.errors.failed);
    setDone(fill(answer.existed ? t.passwordSet : t.added, { login: answer.login ?? login }));
    setPassword("");
    setAgain("");
    router.refresh();
  }

  return (
    <form
      className="space-y-4 rounded-lg border border-border bg-surface p-4"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <div>
        <h2 className="text-xl font-semibold text-foreground">{t.formTitle}</h2>
        <p className="mt-1 text-base text-muted-foreground">{t.formIntro}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-base font-medium text-foreground">{t.login}</span>
          <input
            className={input}
            dir="ltr"
            value={login}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            onChange={(event) => setLogin(event.target.value)}
          />
          <span className="mt-1 block text-base text-muted-foreground">{t.loginHint}</span>
        </label>
        <label className="block">
          <span className="text-base font-medium text-foreground">{t.name}</span>
          <input className={input} value={name} maxLength={80} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="block">
          <span className="text-base font-medium text-foreground">{t.password}</span>
          <input
            className={input}
            dir="ltr"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <span className="mt-1 block text-base text-muted-foreground">{t.passwordHint}</span>
        </label>
        <label className="block">
          <span className="text-base font-medium text-foreground">{t.again}</span>
          <input
            className={input}
            dir="ltr"
            type="password"
            autoComplete="new-password"
            value={again}
            onChange={(event) => setAgain(event.target.value)}
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={busy || !login.trim() || !password}
        className="min-h-[48px] rounded-lg bg-foreground px-5 text-base font-medium text-background disabled:opacity-50"
      >
        {t.save}
      </button>
      {error ? <p className="text-base text-destructive">{error}</p> : null}
      {done ? <p className="text-base font-medium text-app-success">{done}</p> : null}
    </form>
  );
}

export function StaffActions({ t, userId, login, isYou }: { t: Words; userId: string; login: string; isYou: boolean }) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function run(action: "reset_factor" | "remove") {
    setBusy(true);
    setMessage(null);
    const answer = await post({ action, userId });
    setBusy(false);
    setAsking(false);
    if (!answer.ok) return setMessage({ ok: false, text: t.errors[answer.error ?? "failed"] ?? t.errors.failed });
    setMessage({ ok: true, text: action === "remove" ? t.removed : t.factorReset });
    router.refresh();
  }

  const quiet = "min-h-[44px] rounded-lg border border-border px-4 text-base text-foreground hover:border-foreground disabled:opacity-50";

  return (
    <div className="mt-2 space-y-2">
      {asking ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-base text-foreground">{fill(t.removeConfirm, { login })}</span>
          <button type="button" disabled={busy} onClick={() => void run("remove")} className="min-h-[44px] rounded-lg bg-app-danger px-4 text-base font-medium text-background disabled:opacity-50">
            {t.removeYes}
          </button>
          <button type="button" onClick={() => setAsking(false)} className={quiet}>
            {t.cancel}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={busy} onClick={() => void run("reset_factor")} className={quiet}>
            {t.resetFactor}
          </button>
          {!isYou ? (
            <button type="button" onClick={() => setAsking(true)} className="min-h-[44px] rounded-lg border border-app-danger px-4 text-base text-app-danger hover:bg-app-danger-soft">
              {t.remove}
            </button>
          ) : null}
        </div>
      )}
      {message ? <p className={`text-base ${message.ok ? "text-app-success" : "text-destructive"}`}>{message.text}</p> : null}
    </div>
  );
}
