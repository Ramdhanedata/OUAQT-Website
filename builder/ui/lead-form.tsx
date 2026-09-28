"use client";

import { useState } from "react";
import type { Pack } from "@/app-ui/config";
import type { BuilderCopy } from "@/builder/copy";
import { sendLead } from "@/lib/send-lead";
import { fill } from "@/lib/utils";
import { Button } from "./owner-button";
import { Field, TextInput } from "./fields";

/*
 * For the owner whose business is not in the list, and for the packs that are
 * not open yet. He leaves a number and we stop asking him questions, because
 * there is nothing to build for him today and pretending otherwise wastes his
 * evening.
 *
 * A pack he tapped is named back to him, and only his number is asked: he
 * has just said what he does, and asking again reads as not listening.
 *
 * What he writes and his number go to OUAQT's inbox (lib/send-lead.ts).
 */
export function LeadForm({
  copy,
  pack,
  whatsappUrl,
  onBack,
  backLabel,
}: {
  copy: BuilderCopy;
  pack: Pack | null;
  whatsappUrl: string;
  onBack: () => void;
  backLabel: string;
}) {
  const [businessType, setBusinessType] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">(
    "idle"
  );

  const ready = (pack !== null || businessType.trim().length > 1) && phone.trim().length > 5;

  async function send() {
    setState("sending");
    try {
      const sent = await sendLead({ phone, ...(pack ? { pack } : { businessType }) });
      setState(sent ? "sent" : "failed");
    } catch {
      setState("failed");
    }
  }

  if (state === "sent") {
    return (
      <div className="space-y-6">
        <p className="text-lg leading-relaxed text-foreground">
          {copy.lead.thanks}
        </p>
        <Button type="button" variant="outline" onClick={onBack}>
          {backLabel}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pack ? (
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            {fill(copy.lead.soonHeading, { trade: (copy.packs as Record<string, string>)[pack] ?? pack })}
          </h2>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">{copy.lead.soonIntro}</p>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-semibold text-foreground">{copy.lead.heading}</h2>
          <Field label={copy.lead.business} help={copy.lead.businessHelp}>
            <TextInput value={businessType} onChange={setBusinessType} />
          </Field>
        </>
      )}

      <Field label={copy.lead.phone}>
        <TextInput
          dir="ltr"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={setPhone}
        />
      </Field>

      {state === "failed" ? (
        <p className="text-base leading-relaxed text-destructive">
          {copy.lead.error}{" "}
          <a href={whatsappUrl} className="underline">
            {copy.shell.help}
          </a>
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={() => void send()}
          disabled={!ready || state === "sending"}
        >
          {copy.lead.submit}
        </Button>
        <Button type="button" variant="outline" onClick={onBack}>
          {backLabel}
        </Button>
      </div>
    </div>
  );
}
