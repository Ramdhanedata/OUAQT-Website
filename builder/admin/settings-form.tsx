"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fill } from "@/lib/utils";
import type { PanelCopy } from "./copy-panel";
import { shownValue, typedValue, type SettingShape } from "./settings-model";

/*
 * One setting, shown as what it is, and one save.
 *
 * A price is typed in ouguiyas, a length in days, a rule is a switch. Nothing
 * is sent while a value is only being typed: the Save button appears beside
 * a field once it differs from what is stored, and Enter presses it. So a
 * page full of prices can be read, and scrolled past, without one of them
 * moving by accident.
 *
 * The server has the last word (app/api/admin/settings): it refuses a value
 * of another kind, and one the site could not read its settings with.
 */

type Words = PanelCopy["settings"];

async function send(key: string, value: unknown): Promise<string | null> {
  const response = await fetch("/api/admin/settings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key, value: JSON.stringify(value) }),
  }).catch(() => null);
  if (response?.ok) return null;
  const body = (await response?.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? "not_saved";
}

const box = "min-h-[44px] w-full rounded-lg border border-border bg-background px-3 text-[15px] text-foreground outline-none focus:border-foreground";

export function SettingField({
  settingKey,
  shape,
  stored,
  label,
  hint,
  words,
  bare,
}: {
  settingKey: string;
  shape: SettingShape;
  /* The value as the database holds it. */
  stored: unknown;
  label: string;
  hint?: string | null;
  words: Words;
  /* No visible label: the field sits in a table whose row and column name it. */
  bare?: boolean;
}) {
  const router = useRouter();
  const asText = (value: unknown) => (shape.kind === "switch" ? String(Boolean(value)) : shownValue(shape.kind, value));
  const [saved, setSaved] = useState(asText(stored));
  const [text, setText] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const dirty = text !== saved;

  /*
   * Saved from somewhere else on the page, the addresses for every trade at
   * once: follow what is stored now, unless this field is being typed in.
   */
  const arrived = asText(stored);
  const [seen, setSeen] = useState(arrived);
  if (arrived !== seen) {
    setSeen(arrived);
    if (text === saved) setText(arrived);
    setSaved(arrived);
  }

  async function save() {
    const typed = typedValue(shape, text);
    if (!typed.ok) return setProblem(words.errors[typed.error]);
    setBusy(true);
    setProblem(null);
    const error = await send(settingKey, typed.value);
    setBusy(false);
    if (error) return setProblem(words.errors[error] ?? words.errors.not_saved);
    const now = asText(typed.value);
    setSaved(now);
    setText(now);
    setDone(true);
    window.setTimeout(() => setDone(false), 2500); // not-a-rule: how long "saved" shows
    router.refresh();
  }

  const buttons = (
    <>
      {dirty ? (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => void save()}
            className="min-h-[44px] shrink-0 rounded-lg bg-foreground px-4 text-sm font-medium text-background disabled:opacity-50"
          >
            {words.save}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setText(saved);
              setProblem(null);
            }}
            className="min-h-[44px] shrink-0 rounded-lg px-2 text-sm text-muted-foreground hover:text-foreground"
          >
            {words.undo}
          </button>
        </>
      ) : done ? (
        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-app-success">
          <Check aria-hidden className="h-4 w-4" />
          {words.saved}
        </span>
      ) : null}
    </>
  );

  const unit = shape.unit ? words.units[shape.unit] : null;
  const name = (
    <>
      <span className="block text-[15px] font-medium text-foreground">{label}</span>
      {hint ? <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">{hint}</span> : null}
    </>
  );

  if (shape.kind === "switch") {
    const on = text === "true";
    return (
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">{name}</div>
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={label}
            disabled={busy}
            onClick={() => {
              setText(String(!on));
              setProblem(null);
            }}
            className={`relative mt-0.5 inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${on ? "bg-app-success" : "bg-foreground/20"}`}
          >
            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-6 rtl:-translate-x-6" : "translate-x-1 rtl:-translate-x-1"}`} />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={`text-sm font-medium ${on ? "text-app-success" : "text-muted-foreground"}`}>{on ? words.on : words.off}</span>
          {buttons}
        </div>
        {problem ? <p className="mt-2 text-sm text-destructive">{problem}</p> : null}
      </div>
    );
  }

  const numeric = shape.kind === "money" || shape.kind === "whole" || shape.kind === "number";
  return (
    <div className="min-w-0">
      {bare ? null : (
        <label htmlFor={`setting-${settingKey}`} className="mb-2 block">
          {name}
        </label>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`relative block min-w-0 ${numeric ? "w-44" : "flex-1 basis-56"}`}>
          <input
            id={`setting-${settingKey}`}
            aria-label={bare ? label : undefined}
            dir="ltr"
            inputMode={numeric ? "decimal" : undefined}
            value={text}
            placeholder={shape.nullable || shape.kind === "text" ? words.empty : undefined}
            onChange={(event) => {
              setText(event.target.value);
              setProblem(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && dirty && !busy) void save();
            }}
            className={`${box} ${shape.kind === "json" ? "font-mono" : ""} ${unit ? "pr-16" : ""} ${dirty ? "border-foreground" : ""}`}
          />
          {/* The box is left to right in every language, so its unit sits on the right in every language. */}
          {unit ? <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{unit}</span> : null}
        </span>
        {buttons}
      </div>
      {problem ? <p className="mt-2 text-sm text-destructive">{problem}</p> : null}
    </div>
  );
}

/*
 * Where the software downloads from. Every trade has an address of its own
 * for Windows and for Mac, and in practice they all hold the same two: one
 * installer serves every trade. So the page shows two boxes, says how many
 * trades each one serves, and saves a new address for all of them at once.
 * A trade that needs its own address still has its own box, folded under.
 */
export type TradeLink = { key: string; trade: string; value: string };

function commonest(links: TradeLink[]): string {
  const counts = new Map<string, number>();
  for (const one of links) if (one.value) counts.set(one.value, (counts.get(one.value) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

export function DownloadLinks({
  platform,
  title,
  note,
  links,
  words,
}: {
  platform: "windows" | "mac";
  title: string;
  note?: string;
  links: TradeLink[];
  words: Words;
}) {
  const router = useRouter();
  const shared = commonest(links);
  const [text, setText] = useState(shared);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const using = links.filter((one) => one.value === shared && shared !== "").length;
  const typed = text.trim();
  /* Something to do: a new address, or the same one that some trade does not have yet. */
  const pending = typed !== shared || using < links.length;

  useEffect(() => setText(shared), [shared]);

  async function saveAll() {
    setBusy(true);
    setMessage(null);
    for (const one of links) {
      if (one.value === typed) continue;
      const error = await send(one.key, typed);
      if (error) {
        setBusy(false);
        router.refresh();
        return setMessage({ ok: false, text: words.errors[error] ?? words.errors.not_saved });
      }
    }
    setBusy(false);
    setMessage({ ok: true, text: fill(words.links.savedAll, { count: links.length }) });
    router.refresh();
  }

  return (
    <div>
      <label htmlFor={`links-${platform}`} className="block text-[15px] font-medium text-foreground">
        {title}
      </label>
      <p className="mt-0.5 text-sm text-muted-foreground">
        {fill(words.links.shared, { count: using, total: links.length })}
        {note ? ` ${note}` : ""}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          id={`links-${platform}`}
          dir="ltr"
          value={text}
          placeholder={words.empty}
          onChange={(event) => {
            setText(event.target.value);
            setMessage(null);
          }}
          className={`${box} flex-1 basis-72`}
        />
        {pending ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void saveAll()}
            className="min-h-[44px] shrink-0 rounded-lg bg-foreground px-4 text-sm font-medium text-background disabled:opacity-50"
          >
            {words.links.saveAll}
          </button>
        ) : null}
      </div>
      {message ? <p className={`mt-2 text-sm ${message.ok ? "font-medium text-app-success" : "text-destructive"}`}>{message.text}</p> : null}

      <details className="mt-2">
        <summary className="inline-flex min-h-[40px] cursor-pointer items-center text-sm text-muted-foreground hover:text-foreground">{words.links.perTrade}</summary>
        <div className="mt-2 space-y-4 border-s-2 border-border ps-4">
          {links.map((one) => (
            <SettingField
              key={one.key}
              settingKey={one.key}
              shape={{ group: "downloads", kind: "text", unit: null, nullable: false }}
              stored={one.value}
              label={one.trade}
              words={words}
            />
          ))}
        </div>
      </details>
    </div>
  );
}
