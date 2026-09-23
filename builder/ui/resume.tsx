"use client";

import { useEffect, useRef, useState } from "react";
import type { AppLanguage } from "@/app-ui/config";
import type { Pack } from "@/app-ui/packs";
import type { BuilderCopy } from "@/builder/copy";
import { fill } from "@/lib/utils";
import { Button } from "./owner-button";
import { SerialPanel } from "./step-account";

type Installers = { windows: string | null; mac: string | null };

/*
 * Télécharger, on the computer, for a configuration answered on the phone:
 * the shop made from it, on its trial, then the installer and the one-click
 * open. Nothing is asked again, no account on the way; payment stays where
 * it is, after the trial.
 *
 * Kept in its own file, loaded only when a code is opened.
 */
export function ResumeDownload({
  copy,
  language,
  code,
  serial,
  pack,
  name,
  installers,
  tutorials,
  trialDays,
  supportWhatsapp,
}: {
  copy: BuilderCopy;
  language: AppLanguage;
  /* One or the other: a code makes the shop, a serial finds the one made. */
  code?: string;
  serial?: string;
  pack: Pack;
  /* Which configuration this is, so a mistyped code that exists is noticed. */
  name: string;
  installers: Record<Pack, Installers>;
  tutorials: { windows: string | null; mac: string | null };
  trialDays: number | null;
  supportWhatsapp: string | null;
}) {
  const [state, setState] = useState<"busy" | "failed">("busy");
  const [ready, setReady] = useState<{ serial: string; link: string | null; pack: Pack } | null>(null);

  async function prepare() {
    setState("busy");
    const response = await fetch("/api/builder/configuration-code/shop", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(serial ? { serial } : { code }),
    }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as { serial?: string; link?: string | null; pack?: Pack } | null;
    if (!response?.ok || !body?.serial) return setState("failed");
    setReady({ serial: body.serial, link: body.link ?? null, pack: body.pack ?? pack });
  }

  /*
   * Prepared the moment the screen opens: the owner came here to download,
   * so the installer button is the first and only thing he has to press.
   * Safe to repeat, since the same code always finds the same shop.
   */
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void prepare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const which = (
    <p className="text-base font-medium text-foreground">
      {name ? `${name} · ` : ""}
      {(copy.packs as Record<string, string>)[pack] ?? pack}
    </p>
  );

  if (ready) {
    return (
      <div className="space-y-5">
        {which}
        <SerialPanel
          copy={copy}
          language={language}
          serial={ready.serial}
          installers={installers[ready.pack]}
          tutorials={tutorials}
          link={ready.link}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-foreground">{copy.serial.pcHeading}</h2>
      {which}
      {/* A shop found by its serial may be past its trial, or paid: no trial line. */}
      {trialDays && !serial ? (
        <p className="text-base leading-relaxed text-muted-foreground">{fill(copy.code.downloadIntro, { days: trialDays })}</p>
      ) : null}
      {state === "busy" ? (
        <p className="text-base text-muted-foreground" role="status">
          {copy.code.preparing}
        </p>
      ) : (
        <>
          <p className="text-base text-foreground" role="alert">
            {copy.code.downloadFailed}{" "}
            {supportWhatsapp ? (
              <a href={`https://wa.me/${supportWhatsapp}`} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                {copy.code.contact}
              </a>
            ) : null}
          </p>
          <Button type="button" variant="accent" className="min-h-[56px] w-full text-lg" onClick={() => void prepare()}>
            {copy.code.retry}
          </Button>
        </>
      )}
    </div>
  );
}
