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
 * Step 1: what the shop is called and what it sells.
 *
 * Five short screens on a phone, the same five stacked in one column on a
 * computer. Nothing here is technical and nothing is required except the
 * name, because the name is the thing that makes the receipt in the preview
 * his.
 */

export const BUSINESS_SCREENS = 5;

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
  const parts = [PackChoice, Languages, BusinessName, ReceiptDetails, LogoStep];

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
            onClick={() => (open ? update({ pack }) : onLead(pack))}
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

const languageOptions: AppLanguage[] = ["fr", "ar", "en"];

function Languages({ copy, locale, answers, update }: Props) {
  const builder = answers.builderLanguage ?? locale;
  const app = answers.appLanguage ?? builder;

  return (
    <div className="space-y-8">
      <Fieldset legend={copy.language.heading}>
        {languageOptions.map((option) => (
          <ChoiceButton
            key={option}
            selected={builder === option}
            onClick={() =>
              update({
                builderLanguage: option,
                appLanguage: answers.appLanguage ?? option,
              })
            }
          >
            {copy.language[option]}
          </ChoiceButton>
        ))}
      </Fieldset>

      <Fieldset legend={copy.language.appHeading}>
        {languageOptions.map((option) => (
          <ChoiceButton
            key={option}
            selected={app === option}
            onClick={() => update({ appLanguage: option })}
          >
            {copy.language[option]}
          </ChoiceButton>
        ))}
      </Fieldset>
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
      <Field label={copy.name.arabic} help={copy.name.arabicHelp}>
        <TextInput
          dir="rtl"
          value={answers.nameArabic ?? ""}
          onChange={(value) => update({ nameArabic: value })}
        />
      </Field>
    </div>
  );
}

function ReceiptDetails({ copy, answers, update }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">
        {copy.receiptDetails.heading}
      </h2>
      <p className="text-base text-muted-foreground">{copy.receiptDetails.help}</p>
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
      update({ logo: logo.colour, logoMono: logo.mono });
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
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">{copy.logo.heading}</h2>
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
            onClick={() => update({ logo: undefined, logoMono: undefined })}
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
          <LogoCard label={copy.logo.colour} src={answers.logo} />
          <LogoCard label={copy.logo.mono} src={answers.logoMono} />
        </div>
      ) : null}
    </div>
  );
}

function LogoCard({ label, src }: { label: string; src: string }) {
  return (
    <figure className="rounded-lg border border-border p-3">
      <div className="flex h-28 items-center justify-center bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="max-h-28 max-w-full object-contain" />
      </div>
      <figcaption className="mt-2 text-base text-muted-foreground">
        {label}
      </figcaption>
    </figure>
  );
}
