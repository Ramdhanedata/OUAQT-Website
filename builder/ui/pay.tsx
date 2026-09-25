"use client";

import { useEffect, useRef, useState } from "react";
import { formatMoney, type AppLanguage } from "@/app-ui";
import type { BuilderCopy } from "@/builder/copy";
import { browserClient } from "@/builder/db/client";
import { appName, type PaymentApp, type PayTo } from "@/builder/payment/apps";
import type { CheckFailure, ReadBack } from "@/builder/payment/checks";
import { ACCEPTED_IMAGES, prepareScreenshot, ScreenshotError } from "@/builder/payment/image";
import type { Price } from "@/builder/payment/pricing";
import { monthlyEquivalent } from "@/builder/payment/pricing";
import { Button } from "./owner-button";
import { fill } from "@/lib/utils";
import { ChoiceButton } from "./fields";

/*
 * Paying, the way it actually happens here: the owner sends the money from
 * the app on his phone, then shows us the confirmation.
 *
 * The amount first, then which app he pays from, then that app's number
 * large enough to copy without squinting, and the same three steps whichever
 * app it is. He types nothing: the amount, the date and the transaction
 * number are on the screenshot. Nothing on this page decides that he has
 * paid; it files what he sends for a person to confirm, and says so.
 */

export function Pay({
  copy,
  language,
  price,
  payTo,
  onSent,
  serial,
}: {
  copy: BuilderCopy;
  language: AppLanguage;
  price: Price;
  /* The apps that have a number to pay to, in the order they are offered. */
  payTo: PayTo[];
  /* What was read, and whether it was confirmed on the spot. */
  onSent: (read: ReadBack | null, confirmed: boolean) => void;
  /*
   * Paying with the numéro de série alone, with no account: the screenshot
   * goes up with the number, and the server files it under that shop.
   */
  serial?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  /* One app is not a choice. */
  const [app, setApp] = useState<PaymentApp | null>(payTo.length === 1 ? payTo[0].app : null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  /* The picture he chose, shown back so he can see it is the right one. */
  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (payTo.length === 0) {
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

  const chosen = payTo.find((one) => one.app === app) ?? null;
  const name = chosen ? appName(chosen.app, language) : "";

  async function send() {
    if (!chosen) return;
    if (!file) return setError(copy.pay.errorImage as string);

    setError(null);
    setBusy(true);

    try {
      const prepared = await prepareScreenshot(file);
      let response: Response;

      if (serial) {
        const form = new FormData();
        form.set("number", serial);
        form.set("plan", price.plan);
        form.set("app", chosen.app);
        form.set("image", prepared, "screenshot.jpg");
        response = await fetch("/api/builder/payment/serial", { method: "POST", body: form });
      } else {
        const supabase = await browserClient();
        const { data: auth } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
        if (!supabase || !auth.user) return setError(copy.pay.errorSend as string);

        const path = `${auth.user.id}/${crypto.randomUUID()}.jpg`;
        const upload = await supabase.storage
          .from("payments")
          .upload(path, prepared, { contentType: "image/jpeg" });
        if (upload.error) return setError(copy.pay.errorSend as string);

        response = await fetch("/api/builder/payment", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ path, app: chosen.app, plan: price.plan }),
        });
      }

      const body = await response.json().catch(() => null);
      if (!response.ok || !body) return setError(copy.pay.errorSend as string);
      if (body.decision === "rejected_auto") {
        return setError(explain(copy, body.failures ?? [], language));
      }
      onSent(body.read ?? null, body.decision === "confirmed");
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

      {payTo.length > 1 ? (
        <div role="group" aria-label={copy.pay.chooseApp as string}>
          <p className="text-base font-medium text-foreground">{copy.pay.chooseApp}</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {payTo.map((one) => (
              <ChoiceButton
                key={one.app}
                selected={one.app === app}
                onClick={() => {
                  setApp(one.app);
                  setCopied(false);
                  setError(null);
                }}
              >
                {appName(one.app, language)}
              </ChoiceButton>
            ))}
          </div>
        </div>
      ) : null}

      {chosen ? (
        <>
          <div className="rounded-xl border border-border p-4">
            <p className="text-base text-muted-foreground">
              {fill(copy.pay.number as string, { app: name })}
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-wider text-foreground">
              <bdi dir="ltr">{chosen.number}</bdi>
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              onClick={() => {
                void navigator.clipboard?.writeText(chosen.number);
                setCopied(true);
              }}
            >
              {copied ? copy.pay.copied : copy.pay.copyNumber}
            </Button>
          </div>

          <ol className="space-y-3">
            {[fill(copy.pay.step1 as string, { app: name }), copy.pay.step2, copy.pay.step3].map((line, index) => (
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
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setError(null);
            }}
          />

          <div>
            <p className="text-base font-medium text-foreground">{copy.pay.screenshot}</p>
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt={copy.pay.screenshotAlt as string}
                className="mt-2 max-h-72 rounded-lg border border-border object-contain"
              />
            ) : null}
            <Button type="button" variant="outline" className="mt-2" onClick={() => input.current?.click()}>
              {file ? copy.pay.replace : copy.pay.choose}
            </Button>
          </div>

          {error ? (
            <p className="text-base leading-relaxed text-destructive" role="alert">{error}</p>
          ) : null}

          <Button type="button" variant="accent" onClick={() => void send()} disabled={busy}>
            {busy ? copy.pay.sending : copy.pay.send}
          </Button>
        </>
      ) : null}
    </div>
  );
}

/*
 * After sending: confirmed already, or with a person; and, when the
 * screenshot was read, what was read off it, so a misreading is seen by the
 * one person who knows what he sent.
 */
export function PaymentReceived({
  copy,
  language,
  read,
  confirmed = false,
}: {
  copy: BuilderCopy;
  language: AppLanguage;
  read: ReadBack | null;
  confirmed?: boolean;
}) {
  const lines: [string, string][] = [];
  if (read?.amount != null) lines.push([copy.pay.readAmount as string, formatMoney(read.amount, language)]);
  if (read?.date) {
    lines.push([
      copy.pay.readDate as string,
      new Date(`${read.date}T00:00:00Z`).toLocaleDateString(language, { timeZone: "UTC" }),
    ]);
  }
  if (read?.reference) lines.push([copy.pay.readReference as string, read.reference]);

  return (
    <div className="space-y-3">
      {confirmed ? (
        <p className="text-base font-medium leading-relaxed text-foreground" role="status">{copy.pay.confirmedNow}</p>
      ) : (
        <p className="text-base leading-relaxed text-muted-foreground">{copy.licence.pending}</p>
      )}
      {lines.length > 0 ? (
        <div className="rounded-xl border border-border p-4">
          <p className="text-base text-muted-foreground">{copy.pay.readTitle}</p>
          <dl className="mt-2 space-y-1">
            {lines.map(([label, value]) => (
              <div key={label} className="flex flex-wrap justify-between gap-x-4">
                <dt className="text-base text-muted-foreground">{label}</dt>
                <dd className="text-base font-medium text-foreground">
                  <bdi dir="ltr">{value}</bdi>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
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
        case "not_receipt":
          return copy.pay.failNotReceipt as string;
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
        case "future_date":
          return copy.pay.failFuture as string;
      }
    })
    .join(" ");
}
