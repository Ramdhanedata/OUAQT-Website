"use client";

import { useRef, useState } from "react";
import { packs as allPacks, type Pack } from "@/app-ui/packs";
import type { AppLanguage } from "@/app-ui/config";
import type { BuilderCopy } from "@/builder/copy";
import type { DraftAnswers } from "@/builder/draft/store";
import { ACCEPTED_TYPES, LogoError, processLogo } from "@/builder/logo/process";
import { ChoiceButton, Field, Fieldset, TextInput } from "./fields";
import { Button } from "@/components/ui/button";

/*
 * Step 1: what the shop is and what it is called.
 *
 * Two short screens on a phone, stacked in one column on a computer. Only the
 * name is required, because the name is the thing that makes the receipt in
 * the preview his. The rest (the Arabic name, the phone, the address, the
 * logo) waits behind one line, and stays out of the way until he opens it.
 */

export const BUSINESS_SCREENS = 2;

type Props = {
  copy: BuilderCopy;
  locale: AppLanguage;
  enabledPacks: Pack[];
  answers: DraftAnswers;
  update: (patch: DraftAnswers) => void;
  screen: number;
  wide: boolean;
  onLead: (pack: Pack | null) => void;
  showNameError: boolean;
  /* "J'ai déjà mon numéro de série", quiet, under the first question. */
  codeEntry?: React.ReactNode;
};

export function StepBusiness(props: Props) {
  const { wide, screen } = props;
  const parts = [PackChoice, NameAndDetails];

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

function PackChoice({ copy, enabledPacks, answers, update, onLead, codeEntry }: Props) {
  return (
    <>
    <Fieldset legend={copy.packs.heading}>
      {allPacks.map((pack) => {
        const open = enabledPacks.includes(pack);
        return (
          <ChoiceButton
            key={pack}
            selected={open && answers.pack === pack}
            note={open ? undefined : copy.packs.soon}
            /*
             * Another trade drops what the AI set for the last one: those
             * features belong to the other trade and would not fit this one.
             */
            onClick={() => (open ? update(answers.pack === pack ? { pack } : { pack, patched: undefined }) : onLead(pack))}
          >
            {copy.packs[pack]}
          </ChoiceButton>
        );
      })}
      <ChoiceButton onClick={() => onLead(null)}>{copy.packs.other}</ChoiceButton>
    </Fieldset>
    {codeEntry ? <div className="mt-6">{codeEntry}</div> : null}
    </>
  );
}

function NameAndDetails(props: Props) {
  const { copy, answers } = props;
  /* Open from the start for an owner who has already filled any of it. */
  const [open, setOpen] = useState(
    Boolean(answers.nameArabic || answers.phone || answers.address || answers.logo)
  );

  return (
    <div className="space-y-6">
      <BusinessName {...props} />
      {open ? (
        <div className="space-y-6 border-t border-border pt-6">
          <ReceiptDetails {...props} />
          <LogoStep {...props} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="min-h-[48px] text-start text-base text-muted-foreground underline decoration-border underline-offset-4"
        >
          {copy.receiptDetails.more}
        </button>
      )}
    </div>
  );
}

function BusinessName({ copy, answers, update, showNameError }: Props) {
  const missing = showNameError && !(answers.nameLatin ?? "").trim();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">{copy.name.heading}</h2>
      <Field
        label={copy.name.latin}
        help={copy.name.latinHelp}
        error={missing ? copy.name.required : undefined}
      >
        <TextInput
          dir="ltr"
          autoComplete="organization"
          value={answers.nameLatin ?? ""}
          onChange={(value) => update({ nameLatin: value })}
        />
      </Field>
    </div>
  );
}

function ReceiptDetails({ copy, answers, update }: Props) {
  return (
    <div className="space-y-6">
      <Field label={copy.name.arabic} help={copy.name.arabicHelp}>
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
        <Button type="button" onClick={() => input.current?.click()}>
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
