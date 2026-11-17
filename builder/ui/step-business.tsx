"use client";

import { useRef, useState } from "react";
import { packs as allPacks, type Pack } from "@/app-ui/packs";
import type { AppLanguage } from "@/app-ui/config";
import type { BuilderCopy } from "@/builder/copy";
import type { DraftAnswers } from "@/builder/draft/store";
import { ACCEPTED_TYPES, LogoError, processLogo } from "@/builder/logo/process";
import { Field, TextInput } from "./fields";
import { Button } from "./owner-button";
import { packIcons } from "@/components/packs/pack-icons";
import { cn } from "@/lib/utils";

/*
 * Step 1, the only one with anything to fill in: what the shop is, and what
 * goes at the top of its receipts.
 *
 * Two short screens on a phone (the trade, then the shop's details), one
 * column on a computer. Nothing is hidden behind a line to open: the name,
 * the phone, the address and the logo are all there, and only the name is
 * required, because the name is the thing that makes the receipt in the
 * preview his.
 */

export const BUSINESS_SCREENS = 2;
/* Which of the two screens holds the name, the one answer that cannot be left empty. */
export const DETAILS_SCREEN = 1;
/* The name's field, so the button that found it empty can put the cursor in it. */
export const NAME_FIELD = "builder-shop-name";

type Props = {
  copy: BuilderCopy;
  locale: AppLanguage;
  enabledPacks: Pack[];
  answers: DraftAnswers;
  update: (patch: DraftAnswers) => void;
  screen: number;
  wide: boolean;
  onLead: (pack: Pack | null) => void;
  /* A trade was tapped: on a phone, the next screen opens by itself. */
  onPicked: () => void;
  /* Back to the trades, from the phone's second screen. */
  onChangePack: () => void;
  showNameError: boolean;
  showPackError: boolean;
  /* "J'ai déjà mon numéro de série", quiet, under the trades. */
  codeEntry?: React.ReactNode;
  /* He came to type his number: its box is the first thing on the screen, the trades after it. */
  codeFirst?: boolean;
};

export function StepBusiness(props: Props) {
  const { wide, screen } = props;
  const parts = [PackChoice, Details];

  if (wide) {
    return (
      <div className="space-y-10">
        {parts.map((Part, index) => (
          <Part key={index} {...props} />
        ))}
      </div>
    );
  }

  const Part = parts[Math.min(screen, parts.length - 1)];
  return <Part {...props} />;
}

function PackChoice({ copy, enabledPacks, answers, update, onLead, onPicked, showPackError, codeEntry, codeFirst }: Props) {
  const missing = showPackError && !answers.pack;
  return (
    <>
      {codeFirst && codeEntry ? <div className="mb-8 border-b border-border pb-8">{codeEntry}</div> : null}
      <fieldset>
        <legend className="text-xl font-semibold text-foreground">{copy.packs.heading}</legend>
        {missing ? <p className="mt-2 text-base text-destructive">{copy.packs.required}</p> : null}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {allPacks.map((pack) => {
            const open = enabledPacks.includes(pack);
            const selected = open && answers.pack === pack;
            const Icon = packIcons[pack];
            return (
              <button
                key={pack}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  if (!open) return onLead(pack);
                  /*
                   * Another trade drops what the AI set for the last one: those
                   * features belong to the other trade and would not fit this one.
                   */
                  update(answers.pack === pack ? { pack } : { pack, patched: undefined });
                  onPicked();
                }}
                className={cn(
                  /* On a narrow phone the name sits under its picture: beside it, "Restaurant ou café" has no room. */
                  "flex min-h-[72px] flex-col items-start gap-2 rounded-xl border p-3 text-start text-base leading-snug transition-colors sm:flex-row sm:items-center sm:gap-3",
                  selected ? "border-foreground bg-foreground/5 font-medium" : "border-border hover:border-foreground/40"
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    selected ? "bg-foreground text-background" : "bg-muted text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <span className="min-w-0">
                  <span className="block">{copy.packs[pack]}</span>
                  {open ? null : <span className="block text-sm text-muted-foreground">{copy.packs.soon}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>
      <div className="mt-4 flex flex-col items-start">
        <button
          type="button"
          onClick={() => onLead(null)}
          className="min-h-[48px] text-start text-base text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
        >
          {copy.packs.other}
        </button>
        {codeFirst ? null : codeEntry}
      </div>
    </>
  );
}

function Details(props: Props) {
  const { copy, wide, answers, enabledPacks, onChangePack } = props;
  const pack = answers.pack && enabledPacks.includes(answers.pack) ? answers.pack : null;
  const Icon = pack ? packIcons[pack] : null;
  return (
    <div className="space-y-6">
      {/*
        * On a phone the trades are on the screen before, and an owner who
        * came with his trade already chosen never saw them: the trade is
        * named here, with the way to change it.
        */}
      {!wide && pack && Icon ? (
        <div className="flex items-center gap-3 rounded-xl bg-muted px-3 py-2">
          <Icon aria-hidden className="h-5 w-5 shrink-0 text-foreground" strokeWidth={1.75} />
          <span className="min-w-0 flex-1 text-base font-medium text-foreground">{copy.packs[pack]}</span>
          <button
            type="button"
            onClick={onChangePack}
            className="min-h-[44px] shrink-0 text-base text-muted-foreground underline decoration-border underline-offset-4"
          >
            {copy.packs.change}
          </button>
        </div>
      ) : null}
      <div>
        <h2 className="text-xl font-semibold text-foreground">{copy.name.heading}</h2>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">{copy.name.intro}</p>
      </div>
      <BusinessName {...props} />
      <ReceiptDetails {...props} />
      <LogoStep {...props} />
    </div>
  );
}

function BusinessName({ copy, answers, update, showNameError }: Props) {
  const missing = showNameError && !(answers.nameLatin ?? "").trim();

  return (
    <Field label={copy.name.latin} error={missing ? copy.name.required : undefined}>
      <TextInput
        id={NAME_FIELD}
        autoComplete="organization"
        value={answers.nameLatin ?? ""}
        onChange={(value) => update({ nameLatin: value })}
      />
    </Field>
  );
}

function ReceiptDetails({ copy, answers, update }: Props) {
  return (
    <div className="space-y-6">
      <Field label={copy.name.arabic}>
        <TextInput
          dir="rtl"
          value={answers.nameArabic ?? ""}
          onChange={(value) => update({ nameArabic: value })}
        />
      </Field>
      <Field label={copy.receiptDetails.phone}>
        <TextInput
          dir="ltr"
          inputMode="tel"
          autoComplete="tel"
          value={answers.phone ?? ""}
          onChange={(value) => update({ phone: value })}
        />
      </Field>
      <Field label={copy.receiptDetails.address}>
        <TextInput
          value={answers.address ?? ""}
          onChange={(value) => update({ address: value })}
        />
      </Field>
    </div>
  );
}

function LogoStep({ copy, answers, update }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function take(file: File | undefined) {
    if (!file) return;
    setError(null);
    setWorking(true);
    try {
      const logo = await processLogo(file);
      update({ logo: logo.colour, logoMono: logo.mono, logoRemoved: false });
    } catch (caught) {
      const reason = caught instanceof LogoError ? caught.reason : "unreadable";
      setError(
        reason === "type"
          ? copy.logo.errorType
          : reason === "too_big"
            ? copy.logo.errorTooBig
            : copy.logo.errorUnreadable
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium text-foreground">{copy.logo.heading}</h3>
      <p className="text-base leading-relaxed text-muted-foreground">
        {copy.logo.help}
      </p>

      <input
        ref={input}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="sr-only"
        onChange={(event) => void take(event.target.files?.[0])}
      />

      <div className="flex flex-wrap gap-3">
        {/* Quiet on purpose: the page's one main action is the button that makes the software. */}
        <Button type="button" variant="outline" onClick={() => input.current?.click()}>
          {answers.logo ? copy.logo.replace : copy.logo.choose}
        </Button>
        {answers.logo ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => update({ logo: undefined, logoMono: undefined, logoRemoved: true })}
          >
            {copy.logo.remove}
          </Button>
        ) : null}
      </div>

      {working ? (
        <p className="text-base text-muted-foreground">{copy.logo.working}</p>
      ) : null}
      {error ? <p className="text-base text-destructive">{error}</p> : null}

      {answers.logo && answers.logoMono ? (
        <div className="grid grid-cols-2 gap-4">
          <LogoCard label={copy.logo.colour} src={answers.logo} surface="screen" />
          <LogoCard label={copy.logo.mono} src={answers.logoMono} surface="paper" />
        </div>
      ) : null}
    </div>
  );
}

/*
 * Each logo shown where it will live: the screen one on the software's own
 * ivory, so the owner sees his logo without its page around it, and the
 * receipt one on white, the colour of the paper.
 */
function LogoCard({ label, src, surface }: { label: string; src: string; surface: "screen" | "paper" }) {
  return (
    <figure className="rounded-lg border border-border p-3">
      <div className={`flex h-28 items-center justify-center rounded-md ${surface === "screen" ? "bg-background" : "bg-white"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="max-h-28 max-w-full object-contain" />
      </div>
      <figcaption className="mt-2 text-base text-muted-foreground">
        {label}
      </figcaption>
    </figure>
  );
}
