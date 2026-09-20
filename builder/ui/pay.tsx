"use client";

import { useRef, useState } from "react";
import { formatMoney, type AppLanguage } from "@/app-ui";
import type { BuilderCopy } from "@/builder/copy";
import { browserClient } from "@/builder/db/client";
import type { CheckFailure } from "@/builder/payment/checks";
import { ACCEPTED_IMAGES, prepareScreenshot, ScreenshotError } from "@/builder/payment/image";
import type { Price } from "@/builder/payment/pricing";
import { monthlyEquivalent } from "@/builder/payment/pricing";
import { Button } from "./owner-button";
import { fill } from "@/lib/utils";
import { Field, TextInput } from "./fields";

/*
 * Paying, the way it actually happens here: the owner sends the money from
 * Bankily on his phone, then shows us the confirmation.
 *
 * Three steps in the order he does them, the number large enough to copy
 * without squinting, and the amount stated before anything else. Nothing on
 * this page decides that he has paid; it files what he sends for a person to
 * confirm, and says so.
 */

export function Pay({
  copy,
  language,
  price,
  bankilyNumber,
  aiReadsImages,
  onSent,
}: {
  copy: BuilderCopy;
  language: AppLanguage;
  price: Price;
  bankilyNumber: string | null;
  aiReadsImages: boolean;
  onSent: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!bankilyNumber) {
    return (
      <p className="text-base leading-relaxed text-muted-foreground">
        {copy.pay.noNumber}
      </p>
    );
  }

  if (price.amount == null) {
    return (
      <p className="text-base leading-relaxed text-muted-foreground">
        {copy.pay.soonPrice}
      </p>
    );
  }

  async function send() {
    if (!file) return setError(copy.pay.errorImage as string);
    /* With no AI to read the screenshot, the reference is all there is. */
    if (!aiReadsImages && reference.trim() === "") {
      return setError(copy.pay.errorReference as string);
    }

    setError(null);
    setBusy(true);

    try {
      const supabase = await browserClient();
      const { data: auth } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
      if (!supabase || !auth.user) return setError(copy.pay.errorSend as string);

      const prepared = await prepareScreenshot(file);
      const path = `${auth.user.id}/${crypto.randomUUID()}.jpg`;

      const upload = await supabase.storage
        .from("payments")
        .upload(path, prepared, { contentType: "image/jpeg" });
      if (upload.error) return setError(copy.pay.errorSend as string);

      const response = await fetch("/api/builder/payment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path, reference: reference.trim() || undefined, plan: price.plan }),
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) return setError(copy.pay.errorSend as string);

      if (body.decision === "rejected_auto") {
        return setError(explain(copy, body.failures ?? [], language));
      }
      onSent();
    } catch (caught) {
      setError(
        caught instanceof ScreenshotError
          ? (copy.pay.errorImage as string)
          : (copy.pay.errorSend as string)
      );
    } finally {
      setBusy(false);
    }
  }

  const monthly = monthlyEquivalent(price.amount);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">{copy.pay.heading}</h2>

      <div className="rounded-xl border border-border p-4">
        <p className="text-base text-muted-foreground">{copy.pay.amount}</p>
        <p className="mt-1 text-2xl font-semibold text-foreground">
          <bdi dir="ltr">{formatMoney(price.amount, language)}</bdi>
        </p>
        <p className="mt-1 text-base text-muted-foreground">
          {fill(copy.pay.perMonth as string, {
            amount: formatMoney(monthly, language),
          })}
        </p>
        {price.launch && price.standard && price.standard !== price.amount ? (
          <p className="mt-2 text-base text-muted-foreground">
            {copy.pay.wasPrice}{" "}
            <s>
              <bdi dir="ltr">{formatMoney(price.standard, language)}</bdi>
            </s>
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-border p-4">
        <p className="text-base text-muted-foreground">{copy.pay.number}</p>
        <p className="mt-1 text-2xl font-semibold tracking-wider text-foreground">
          <bdi dir="ltr">{bankilyNumber}</bdi>
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-3"
          onClick={() => {
            void navigator.clipboard?.writeText(bankilyNumber);
            setCopied(true);
          }}
        >
          {copied ? copy.pay.copied : copy.pay.copyNumber}
        </Button>
      </div>

      <ol className="space-y-3">
        {[copy.pay.step1, copy.pay.step2, copy.pay.step3].map((line, index) => (
          <li key={index} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-base text-muted-foreground">
              {index + 1}
            </span>
            <span className="pt-0.5 text-base leading-relaxed text-foreground">
              {line}
            </span>
          </li>
        ))}
      </ol>

      <input
        ref={input}
        type="file"
        accept={ACCEPTED_IMAGES.join(",")}
        className="sr-only"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />

      <div>
        <p className="text-base font-medium text-foreground">{copy.pay.screenshot}</p>
        <Button type="button" variant="outline" className="mt-2" onClick={() => input.current?.click()}>
          {file ? copy.pay.replace : copy.pay.choose}
        </Button>
        {file ? (
          <p className="mt-2 text-base text-muted-foreground">{file.name}</p>
        ) : null}
      </div>

      <Field label={copy.pay.reference} help={copy.pay.referenceHelp}>
        <TextInput dir="ltr" value={reference} onChange={setReference} />
      </Field>

      {error ? (
        <p className="text-base leading-relaxed text-destructive">{error}</p>
      ) : null}

      <Button type="button" variant="accent" onClick={() => void send()} disabled={busy}>
        {busy ? copy.pay.sending : copy.pay.send}
      </Button>
    </div>
  );
}

/** A refusal in the owner's words, naming what to do about it. */
function explain(
  copy: BuilderCopy,
  failures: CheckFailure[],
  language: AppLanguage
): string {
  return failures
    .map((failure) => {
      switch (failure.code) {
        case "reference_missing":
          return copy.pay.errorReference as string;
        case "reference_used":
          return copy.pay.failReferenceUsed as string;
        case "image_used":
          return copy.pay.failImageUsed as string;
        case "wrong_amount":
          return fill(copy.pay.failAmount as string, {
            found: formatMoney(Number(failure.found ?? 0), language).replace(" MRU", ""),
            expected: formatMoney(Number(failure.expected ?? 0), language).replace(" MRU", ""),
          });
        case "wrong_recipient":
          return copy.pay.failRecipient as string;
        case "too_old":
          return fill(copy.pay.failTooOld as string, {
            expected: String(failure.expected ?? ""),
          });
      }
    })
    .join(" ");
}
