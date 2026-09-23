"use client";

import { useEffect, useState } from "react";
import type { BuilderCopy } from "@/builder/copy";
import { formatAsTyped } from "@/builder/config-code/code";
import type { Pack } from "@/app-ui/packs";
import type { Locale } from "@/lib/i18n/config";
import { localisedHref } from "@/lib/i18n/routes";
import { fill } from "@/lib/utils";
import { Field, TextInput } from "./fields";
import { Button } from "./owner-button";

/*
 * The code de configuration on screen: shown once when the questions end,
 * typed on another device to pick them up, and asked for again by phone
 * number when it is lost.
 *
 * The entry is a quiet line that opens a single field in place. Most people
 * who arrive here are new, and a screen asking everyone "new or returning?"
 * would tax all of them to serve a few.
 */

export type Opened = {
  code: string;
  locale: Locale;
  pack: Pack | null;
  nameLatin: string;
  nameArabic: string;
};

/*
 * A code opened in this tab. Kept for the tab only: on a shop's shared
 * computer the next person to open the builder starts their own, and the
 * code can be typed again any time, since it is never used up.
 */
const OPENED_KEY = "ouaqt.builder.opened";
/* Set before moving to the builder in another language, read by it once. */
export const SWITCHED_FLAG = "ouaqt.builder.switched";

export function readOpened(): Opened | null {
  try {
    const raw = window.sessionStorage.getItem(OPENED_KEY);
    return raw ? (JSON.parse(raw) as Opened) : null;
  } catch {
    return null;
  }
}

export function forgetOpened(): void {
  try {
    window.sessionStorage.removeItem(OPENED_KEY);
  } catch {
    // Nothing kept.
  }
}

/*
 * Everything was answered on the phone: a code opened here goes straight to
 * the download, in the language the configuration was made in, with a note
 * when the page changed language for it.
 */
export function openInBuilder(opened: Opened, from: Locale): void {
  try {
    window.sessionStorage.setItem(OPENED_KEY, JSON.stringify(opened));
    if (opened.locale !== from) window.sessionStorage.setItem(SWITCHED_FLAG, from);
    else window.sessionStorage.removeItem(SWITCHED_FLAG);
  } catch {
    // Without session storage there is nowhere to carry the code to.
  }
  const target = localisedHref(opened.locale, "builder");
  if (window.location.pathname === target) window.location.reload();
  else window.location.href = target;
}

type Problem =
  | { kind: "unknown" }
  | { kind: "expired"; whatsapp: string | null; code: string }
  | { kind: "failed" };

export function CodeEntry({
  copy,
  locale,
  supportWhatsapp,
  onRestart,
}: {
  copy: BuilderCopy;
  locale: Locale;
  supportWhatsapp: string | null;
  /* An expired code: start a fresh configuration, never silently. */
  onRestart?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [wait, setWait] = useState(0);
  const [lost, setLost] = useState(false);

  /* After five wrong entries each try waits a little: the field says how long. */
  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-[48px] text-base text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
      >
        {copy.code.have}
      </button>
    );
  }

  async function submit() {
    if (!value.trim() || busy || wait > 0) return;
    setBusy(true);
    setProblem(null);
    try {
      const response = await fetch("/api/builder/configuration-code/resume", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: value }),
      });
      const body = (await response.json().catch(() => null)) as
        | (Opened & { error?: string; wait?: number; supportWhatsapp?: string | null })
        | null;
      if (response.ok && body?.code) {
        openInBuilder({ code: body.code, locale: body.locale, pack: body.pack, nameLatin: body.nameLatin, nameArabic: body.nameArabic }, locale);
        return;
      }
      if (response.status === 429) {
        setWait(body?.wait ?? 5);
      } else if (response.status === 410) {
        setProblem({ kind: "expired", whatsapp: body?.supportWhatsapp ?? supportWhatsapp, code: value });
      } else if (response.status === 404) {
        setProblem({ kind: "unknown" });
        if (body?.wait) setWait(body.wait);
      } else {
        setProblem({ kind: "failed" });
      }
    } catch {
      setProblem({ kind: "failed" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 text-start">
      <Field label={copy.code.label}>
        <input
          type="text"
          dir="ltr"
          value={value}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="characters"
          placeholder={copy.code.placeholder}
          disabled={wait > 0}
          onChange={(event) => setValue(formatAsTyped(event.target.value))}
          onKeyDown={(event) => {
            if (event.key === "Enter") void submit();
          }}
          className="min-h-[48px] w-full rounded-lg border border-border bg-background px-4 text-lg tracking-wider text-foreground outline-none focus:border-foreground disabled:opacity-50"
        />
      </Field>

      {wait > 0 ? (
        <p className="text-base text-muted-foreground" role="status">
          {fill(copy.code.wait, { seconds: wait })}
        </p>
      ) : null}
      {problem?.kind === "unknown" ? (
        <p className="text-base text-foreground" role="alert">
          {copy.code.unknown}
        </p>
      ) : null}
      {problem?.kind === "failed" ? (
        <p className="text-base text-foreground" role="alert">
          {copy.code.failed}
        </p>
      ) : null}
      {problem?.kind === "expired" ? (
        <div className="space-y-3 rounded-lg border border-border p-4" role="alert">
          <p className="text-base text-foreground">{copy.code.expired}</p>
          <div className="flex flex-wrap gap-3">
            {onRestart ? (
              <Button type="button" variant="outline" className="min-h-[48px] text-base" onClick={onRestart}>
                {copy.code.restart}
              </Button>
            ) : null}
            {problem.whatsapp ? (
              /* The message carries the code, so staff can revive it without asking. */
              <a
                href={`https://wa.me/${problem.whatsapp}?text=${encodeURIComponent(fill(copy.code.expiredMessage, { code: problem.code }))}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[48px] items-center rounded-lg border border-border px-4 text-base text-foreground"
              >
                {copy.code.contact}
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      <Button type="button" variant="outline" className="min-h-[48px] text-base" disabled={busy || wait > 0} onClick={() => void submit()}>
        {busy ? copy.code.opening : copy.code.open}
      </Button>

      <div>
        {lost ? (
          <LostCode copy={copy} />
        ) : (
          <button
            type="button"
            onClick={() => setLost(true)}
            className="min-h-[48px] text-base text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
          >
            {copy.code.lost}
          </button>
        )}
      </div>
    </div>
  );
}

/*
 * The code again, by the phone number given during the questions. The
 * answer on screen is the same whether the number was known or not, and the
 * code itself only ever goes to that number.
 */
function LostCode({ copy }: { copy: BuilderCopy }) {
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [wait, setWait] = useState(0);

  async function send() {
    if (!phone.trim() || state === "sending") return;
    setState("sending");
    const response = await fetch("/api/builder/configuration-code/resend", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone }),
    }).catch(() => null);
    if (response?.status === 429) {
      const body = (await response.json().catch(() => null)) as { wait?: number } | null;
      setWait(body?.wait ?? 5);
      setState("idle");
      return;
    }
    setState("done");
  }

  if (state === "done") {
    return (
      <p className="text-base text-foreground" role="status">
        {copy.code.lostDone}
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <p className="text-base leading-relaxed text-muted-foreground">{copy.code.lostIntro}</p>
      <Field label={copy.code.lostPhone}>
        <TextInput value={phone} onChange={setPhone} dir="ltr" inputMode="tel" autoComplete="tel" />
      </Field>
      {wait > 0 ? <p className="text-base text-muted-foreground">{fill(copy.code.wait, { seconds: wait })}</p> : null}
      <Button type="button" variant="outline" className="min-h-[48px] text-base" disabled={state === "sending"} onClick={() => void send()}>
        {copy.code.lostSend}
      </Button>
    </div>
  );
}

/*
 * The code, the moment the questions are done: large, with a copy button,
 * and a plain sentence on what it is for. Sent on WhatsApp too once that is
 * connected; until then the screen asks him to keep it, and never claims a
 * message went out.
 */
export function CodeIssued({
  copy,
  code,
  sent,
  hasPhone,
  onPhone,
  onContinue,
}: {
  copy: BuilderCopy;
  code: string;
  sent: boolean;
  hasPhone: boolean;
  onPhone: (phone: string) => Promise<boolean>;
  onContinue: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [phone, setPhone] = useState("");
  const [savedPhone, setSavedPhone] = useState(hasPhone);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">{copy.code.issuedHeading}</h2>
      <p className="whitespace-nowrap text-xl font-semibold tracking-wider min-[360px]:text-2xl text-foreground sm:text-4xl sm:tracking-widest">
        <bdi dir="ltr">{code}</bdi>
      </p>
      <Button
        type="button"
        variant="outline"
        className="min-h-[48px] text-base"
        onClick={() => {
          void navigator.clipboard?.writeText(code).then(() => setCopied(true));
        }}
      >
        {copied ? copy.code.copied : copy.code.copy}
      </Button>
      <p className="text-base leading-relaxed text-foreground">{copy.code.issuedIntro}</p>
      <p className="text-base leading-relaxed text-muted-foreground">{sent ? copy.code.issuedSent : copy.code.issuedKeep}</p>
      <p className="text-base leading-relaxed text-muted-foreground">{copy.code.issuedNotSerial}</p>

      {!savedPhone ? (
        <div className="space-y-3">
          <Field label={copy.code.issuedPhone}>
            <TextInput value={phone} onChange={setPhone} dir="ltr" inputMode="tel" autoComplete="tel" />
          </Field>
          <Button
            type="button"
            variant="outline"
            className="min-h-[48px] text-base"
            disabled={!phone.trim()}
            onClick={() => void onPhone(phone).then((ok) => ok && setSavedPhone(true))}
          >
            {copy.code.issuedPhoneSave}
          </Button>
        </div>
      ) : phone ? (
        <p className="text-base text-muted-foreground">{copy.code.issuedPhoneSaved}</p>
      ) : null}

      <Button type="button" variant="accent" className="min-h-[48px] text-base" onClick={onContinue}>
        {copy.code.issuedContinue}
      </Button>
    </div>
  );
}
