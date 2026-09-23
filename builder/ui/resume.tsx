"use client";

import { useState } from "react";
import type { AppLanguage } from "@/app-ui/config";
import type { Pack } from "@/app-ui/packs";
import type { BuilderCopy } from "@/builder/copy";
import { resumedCode, type DraftAnswers } from "@/builder/draft/store";
import type { ImportedProduct } from "@/builder/import/parse";
import { interviewFor } from "@/builder/packs";
import { fill } from "@/lib/utils";
import { Button } from "./owner-button";
import { SerialPanel } from "./step-account";
import { Summary } from "./summary";

/*
 * The two screens of a configuration opened by code: what he configured,
 * read back line by line with a way to change each one, and the download.
 *
 * Kept in their own file, loaded only when a code is opened, because the
 * summary brings every question bank with it.
 */

type Installers = { windows: string | null; mac: string | null };

const LANGUAGE_NAMES: Record<AppLanguage, string> = { fr: "Français", ar: "العربية", en: "English" };

export function ResumeSummary({
  copy,
  language,
  answers,
  onEdit,
  onContinue,
}: {
  copy: BuilderCopy;
  language: AppLanguage;
  answers: DraftAnswers;
  onEdit: (step: number) => void;
  onContinue: () => void;
}) {
  const pack = answers.pack;
  const packs = copy.packs as Record<string, string>;
  const rows: { label: string; value: React.ReactNode; step: number }[] = [
    { label: copy.code.trade, value: pack ? packs[pack] ?? pack : null, step: 0 },
    /* The same fallback the shop is made with: see the shop route. */
    { label: copy.code.language, value: LANGUAGE_NAMES[answers.appLanguage ?? answers.builderLanguage ?? language], step: 0 },
    {
      label: copy.code.logo,
      value: answers.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={answers.logo} alt="" className="h-12 w-auto rounded border border-border bg-white object-contain" />
      ) : (
        copy.code.noLogo
      ),
      step: 0,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{copy.code.summaryHeading}</h2>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">{copy.code.summaryIntro}</p>
      </div>
      <dl className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 border-b border-border pb-3">
            <div>
              <dt className="text-base text-muted-foreground">{row.label}</dt>
              <dd className="mt-1 text-base font-medium text-foreground">{row.value ?? ""}</dd>
            </div>
            <button
              type="button"
              onClick={() => onEdit(row.step)}
              className="min-h-[48px] shrink-0 text-base text-muted-foreground underline decoration-border underline-offset-4"
            >
              {copy.code.edit}
            </button>
          </div>
        ))}
      </dl>
      {pack ? <Summary copy={copy} language={language} answers={answers} questions={interviewFor(pack as Pack)} onEdit={onEdit} bare /> : null}
      <Button type="button" variant="accent" className="min-h-[48px] text-base" onClick={onContinue}>
        {copy.code.continue}
      </Button>
    </div>
  );
}

/*
 * Télécharger: the shop made from the configuration, on its trial, then the
 * installer and the one-click open. No account on the way; payment stays
 * where it is, after the trial.
 */
export function ResumeDownload({
  copy,
  language,
  pack,
  products,
  installers,
  tutorials,
  trialDays,
  supportWhatsapp,
  onReady,
}: {
  copy: BuilderCopy;
  language: AppLanguage;
  pack: Pack;
  /* The shop exists: the builder's Back and Continue have nothing left to do. */
  onReady: (serial: string) => void;
  products: ImportedProduct[];
  installers: Record<Pack, Installers>;
  tutorials: { windows: string | null; mac: string | null };
  trialDays: number | null;
  supportWhatsapp: string | null;
}) {
  const [state, setState] = useState<"idle" | "busy" | "failed">("idle");
  const [ready, setReady] = useState<{ serial: string; link: string | null; pack: Pack } | null>(null);

  async function download() {
    const code = resumedCode();
    if (!code) return setState("failed");
    setState("busy");
    const response = await fetch("/api/builder/configuration-code/shop", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, products }),
    }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as { serial?: string; link?: string | null; pack?: Pack } | null;
    if (!response?.ok || !body?.serial) return setState("failed");
    setReady({ serial: body.serial, link: body.link ?? null, pack: body.pack ?? pack });
    setState("idle");
    onReady(body.serial);
  }

  if (ready) {
    return (
      <SerialPanel
        copy={copy}
        language={language}
        serial={ready.serial}
        installers={installers[ready.pack]}
        tutorials={tutorials}
        link={ready.link}
      />
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-foreground">{copy.serial.pcHeading}</h2>
      {trialDays ? <p className="text-base leading-relaxed text-muted-foreground">{fill(copy.code.downloadIntro, { days: trialDays })}</p> : null}
      {products.length === 0 ? <p className="text-base leading-relaxed text-muted-foreground">{copy.code.productsLater}</p> : null}
      {state === "failed" ? (
        <p className="text-base text-foreground" role="alert">
          {copy.code.downloadFailed}{" "}
          {supportWhatsapp ? (
            <a href={`https://wa.me/${supportWhatsapp}`} target="_blank" rel="noreferrer" className="underline underline-offset-4">
              {copy.code.contact}
            </a>
          ) : null}
        </p>
      ) : null}
      <Button type="button" variant="accent" className="min-h-[56px] w-full text-lg" disabled={state === "busy"} onClick={() => void download()}>
        {state === "busy" ? copy.code.preparing : copy.code.download}
      </Button>
    </div>
  );
}
