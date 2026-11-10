"use client";

import { useState } from "react";
import { fill } from "@/lib/utils";
import type { AdminCopy } from "./copy";

/*
 * OUAQT's own test devices (0040): the list, the button that takes one off
 * it, and the QR code that puts an iPhone on it.
 */

export type TesterRow = {
  id: string;
  label: string;
  kind: "computer" | "iphone" | "device" | "pending";
  installs: number;
  addedAt: string;
  until: string | null;
};

type Words = { t: AdminCopy["testers"]; locale: string; minutes: number };

export function TesterDevices({ rows, words }: { rows: TesterRow[]; words: Words }) {
  const [gone, setGone] = useState<Record<string, boolean>>({});
  const shown = rows.filter((row) => !gone[row.id]);

  return (
    <>
      {shown.length === 0 ? (
        <p className="mt-3 text-base text-muted-foreground">{words.t.none}</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {shown.map((row) => (
            <li key={row.id} className="py-4">
              <Tester row={row} words={words} onGone={() => setGone((all) => ({ ...all, [row.id]: true }))} />
            </li>
          ))}
        </ul>
      )}
      <AddIphone words={words} />
    </>
  );
}

function Tester({ row, words, onGone }: { row: TesterRow; words: Words; onGone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const time = (iso: string) => new Date(iso).toLocaleTimeString(words.locale, { hour: "2-digit", minute: "2-digit" });

  const what =
    row.kind === "computer"
      ? words.t.computer
      : row.kind === "iphone"
        ? fill(words.t.iphone, { count: row.installs })
        : row.kind === "pending"
          ? fill(words.t.pending, { time: row.until ? time(row.until) : "" })
          : words.t.device;

  async function remove() {
    setBusy(true);
    setError(false);
    const response = await fetch("/api/admin/tester-device/remove", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: row.id }),
    });
    setBusy(false);
    if (!response.ok) return setError(true);
    onGone();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-base text-foreground">{row.label || words.t.unnamed}</p>
        <p className="text-sm text-muted-foreground">
          {what} · {fill(words.t.added, { date: new Date(row.addedAt).toLocaleDateString(words.locale) })}
        </p>
        {error ? <p className="text-sm text-destructive">{words.t.notRemoved}</p> : null}
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={() => void remove()}
        className="min-h-[44px] rounded-lg border border-border px-4 text-base text-foreground"
      >
        {words.t.remove}
      </button>
    </div>
  );
}

function AddIphone({ words }: { words: Words }) {
  const [label, setLabel] = useState(words.t.qrDefault);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [made, setMade] = useState<{ qr: string; link: string; until: string } | null>(null);

  async function make() {
    setBusy(true);
    setError(false);
    const response = await fetch("/api/admin/tester-device/qr", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label: label.trim() || words.t.qrDefault }),
    });
    setBusy(false);
    if (!response.ok) return setError(true);
    setMade((await response.json()) as { qr: string; link: string; until: string });
  }

  return (
    <section className="mt-10 max-w-2xl rounded-xl border border-border p-5">
      <h2 className="text-lg font-medium text-foreground">{words.t.qrTitle}</h2>
      <p className="mt-2 text-base leading-relaxed text-muted-foreground">{fill(words.t.qrIntro, { minutes: words.minutes })}</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm text-muted-foreground">
          {words.t.qrLabel}
          <input
            type="text"
            value={label}
            maxLength={60} // not-a-rule: the length the server accepts for a name
            onChange={(event) => setLabel(event.target.value)}
            className="min-h-[48px] rounded-lg border border-border bg-background px-4 text-base text-foreground outline-none focus:border-foreground"
          />
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => void make()}
          className="min-h-[48px] self-end rounded-lg bg-foreground px-5 text-base font-medium text-background"
        >
          {words.t.qrMake}
        </button>
      </div>
      {error ? <p className="mt-2 text-base text-destructive">{words.t.qrNotMade}</p> : null}

      {made ? (
        <div className="mt-6">
          {/* eslint-disable-next-line @next/next/no-img-element -- a data address made on the server, not a page asset */}
          <img src={made.qr} alt={words.t.qrAlt} width={280} height={280} className="rounded-lg border border-border bg-white" />
          <p className="mt-3 text-base text-foreground">
            {fill(words.t.qrValid, {
              time: new Date(made.until).toLocaleTimeString(words.locale, { hour: "2-digit", minute: "2-digit" }),
            })}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{words.t.qrOld}</p>
        </div>
      ) : null}
    </section>
  );
}
