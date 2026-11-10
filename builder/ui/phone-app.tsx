"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { BuilderCopy } from "@/builder/copy";

/*
 * The owner's software on his phone, from his account.
 *
 * The phone app lives at /app (built in the desktop repository, see its
 * docs/PHONE.md). With the serial after the #, it opens on his shop by
 * itself: on a phone, one button; on a computer, a code the phone's camera
 * reads. The part after # never reaches our server.
 *
 * Then, once, he adds it to his home screen, and it has its own icon and
 * works with no internet. How depends on the phone, so both ways are said.
 */

export function phoneAppLink(serial: string, testerPass: string | null = null): string {
  /*
   * The language too: an iPhone shows its first screen before any shop tells
   * it which to speak. And on one of OUAQT's test iPhones, its pass, which an
   * icon added from that page keeps in its address (0040,
   * builder/licence/tester-pass-shared.ts).
   */
  /* Through /app, which the site answers itself (middleware.ts), not the page a phone may keep. */
  const pass = testerPass ? `?tp=${encodeURIComponent(testerPass)}` : "";
  return `${window.location.origin}/app${pass}#serial=${encodeURIComponent(serial)}&lang=${document.documentElement.lang}`;
}

/* A test iPhone's browser holds a pass: ask for it, only then (the mark is set by the middleware). */
async function testerPassHere(): Promise<string | null> {
  if (!document.cookie.split(";").some((part) => part.trim().startsWith("ouaqt_tester="))) return null;
  try {
    const response = await fetch("/api/tester-device/carry", { cache: "no-store" });
    if (response.status !== 200) return null;
    const body = (await response.json()) as { tp?: unknown };
    return typeof body.tp === "string" ? body.tp : null;
  } catch {
    return null;
  }
}

/* A touch screen as narrow as a phone. Read once, after the page is in the browser. */
function onAPhone(): boolean {
  return window.matchMedia("(pointer: coarse) and (max-width: 820px)").matches;
}

export function PhoneApp({ copy, serial }: { copy: BuilderCopy; serial: string }) {
  const [phone, setPhone] = useState<boolean | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [testerPass, setTesterPass] = useState<string | null>(null);

  useEffect(() => {
    const here = onAPhone();
    setPhone(here);
    if (here) {
      void testerPassHere().then(setTesterPass);
      return;
    }
    void QRCode.toDataURL(phoneAppLink(serial), { margin: 1, width: 240, errorCorrectionLevel: "M" })
      .then(setCode)
      .catch(() => setCode(null));
  }, [serial]);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">{copy.phoneApp.heading}</h2>
      <p className="text-base leading-relaxed text-muted-foreground">{copy.phoneApp.intro}</p>

      {phone === true ? (
        <a
          href={phoneAppLink(serial, testerPass)}
          className="inline-flex min-h-[52px] items-center rounded-lg bg-foreground px-6 text-base font-semibold text-background"
        >
          {copy.phoneApp.open}
        </a>
      ) : phone === false && code ? (
        <div className="flex flex-wrap items-center gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element -- a data URL made here, nothing for Next to optimise */}
          <img src={code} alt="" width={180} height={180} className="rounded-lg border border-border bg-white p-2" />
          <p className="max-w-sm text-base leading-relaxed text-foreground">{copy.phoneApp.scan}</p>
        </div>
      ) : null}

      <ul className="space-y-2 text-base leading-relaxed text-foreground">
        <li>{copy.phoneApp.iphone}</li>
        <li>{copy.phoneApp.android}</li>
      </ul>
      <p className="text-base leading-relaxed text-muted-foreground">{copy.phoneApp.note}</p>
    </section>
  );
}
