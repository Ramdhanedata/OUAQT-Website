"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { BuilderCopy } from "@/builder/copy";
import { Smartphone } from "lucide-react";

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

export function PhoneApp({
  copy,
  serial,
  lead = false,
}: {
  copy: BuilderCopy;
  serial: string;
  /* On a phone this is the page's main action: the software is ready, and one press opens it. */
  lead?: boolean;
}) {
  const [phone, setPhone] = useState<boolean | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [testerPass, setTesterPass] = useState<string | null>(null);
  /* Which phone this is, when it says: it is told how to keep the app on its own home screen, not the other's. */
  const [kind, setKind] = useState<"iphone" | "android" | null>(null);

  useEffect(() => {
    const here = onAPhone();
    setPhone(here);
    if (here) {
      const agent = navigator.userAgent;
      setKind(/iPhone|iPad|iPod/i.test(agent) ? "iphone" : /Android/i.test(agent) ? "android" : null);
      void testerPassHere().then(setTesterPass);
      return;
    }
    void QRCode.toDataURL(phoneAppLink(serial), { margin: 1, width: 240, errorCorrectionLevel: "M" })
      .then(setCode)
      .catch(() => setCode(null));
  }, [serial]);

  return (
    <section className="space-y-4">
      {lead ? (
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">{copy.serial.pcHeading}</h2>
      ) : (
        <h2 className="text-xl font-semibold text-foreground">{copy.phoneApp.heading}</h2>
      )}

      {/* What to press comes before what to read. */}
      {phone === true ? (
        <a
          href={phoneAppLink(serial, testerPass)}
          className={
            lead
              ? "flex min-h-[60px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-accent px-4 text-base font-semibold text-accent-foreground sm:text-lg"
              : "inline-flex min-h-[52px] items-center gap-2 rounded-full bg-foreground px-6 text-base font-semibold text-background"
          }
        >
          <Smartphone className="h-5 w-5" />
          {copy.phoneApp.open}
        </a>
      ) : phone === false && code ? (
        <div className="flex flex-wrap items-center gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element -- a data URL made here, nothing for Next to optimise */}
          <img src={code} alt="" width={180} height={180} className="rounded-lg border border-border bg-white p-2" />
          <p className="max-w-sm text-base leading-relaxed text-foreground">{copy.phoneApp.scan}</p>
        </div>
      ) : null}

      <p className="text-base leading-relaxed text-muted-foreground">{lead ? copy.phoneApp.leadIntro : copy.phoneApp.intro}</p>
      <ul className="space-y-2 text-base leading-relaxed text-foreground">
        {kind === "android" ? null : <li>{copy.phoneApp.iphone}</li>}
        {kind === "iphone" ? null : <li>{copy.phoneApp.android}</li>}
      </ul>
      <p className="text-base leading-relaxed text-muted-foreground">{copy.phoneApp.note}</p>
    </section>
  );
}
