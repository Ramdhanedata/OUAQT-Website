"use client";

import { useEffect, useRef, useState } from "react";
import { formatMoney, type AppLanguage } from "@/app-ui";
import type { BuilderCopy } from "@/builder/copy";
import { browserClient } from "@/builder/db/client";
import { appName, type PaymentApp, type PayTo } from "@/builder/payment/apps";
import { organization } from "@/lib/data/contact";
import type { CheckFailure, ReadBack } from "@/builder/payment/checks";
import { ACCEPTED_IMAGES, prepareScreenshot, ScreenshotError } from "@/builder/payment/image";
import { perMonthOf, type Price } from "@/builder/payment/pricing";
import { Button } from "./owner-button";
import { fill } from "@/lib/utils";
import { ChoiceButton } from "./fields";

/*
 * Paying, the way it actually happens here: the owner sends the money from
 * the app on his phone, then shows us the confirmation.
 *
 * The amount first, and whether it pays for a year or six months; then which
 * app he pays from, that app's number large enough to copy without
 * squinting, and two steps: pay, then send the screenshot. He types nothing:
 * the amount, the date and the transaction number are on the screenshot. It
 * is checked while he waits, and he is told at once whether it went through.
 */

export function Pay({
  copy,
  language,
  prices,
  payTo,
  onSent,
  serial,
}: {
  copy: BuilderCopy;
  language: AppLanguage;
  /* A year first, then six months: the lengths he may pay for, with their prices. */
  prices: Price[];
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
  /* Refused on sight: the screenshot shows something other than what was expected. */
  const [refused, setRefused] = useState<string[] | null>(null);
  const [plan, setPlan] = useState(prices[0]?.plan ?? "annual");
  const price = prices.find((one) => one.plan === plan) ?? prices[0];

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

  if (!price || price.amount == null) {
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
    setRefused(null);
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
        return setRefused(explain(copy, body.failures ?? [], language));
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

  const monthly = perMonthOf(price.plan, price.amount);
  const lengthOf = (one: Price) => (one.plan === "semiannual" ? copy.pay.sixMonths : copy.pay.year) as string;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">{copy.pay.heading}</h2>

      <div className="rounded-xl border border-border p-4">
        <p className="text-base text-muted-foreground">{copy.pay.amount}</p>
        <p className="mt-1 text-2xl font-semibold text-foreground">
          <bdi dir="ltr">{formatMoney(price.amount, language)}</bdi>
        </p>
        {monthly != null ? (
          <p className="mt-1 text-base text-muted-foreground">
            {fill(copy.pay.perMonth as string, {
              amount: formatMoney(monthly, language),
            })}
          </p>
        ) : null}
        {price.launch && price.standard && price.standard !== price.amount ? (
          <p className="mt-2 text-base text-muted-foreground">
            {copy.pay.wasPrice}{" "}
            <s>
              <bdi dir="ltr">{formatMoney(price.standard, language)}</bdi>
            </s>
          </p>
        ) : null}
      </div>

      {prices.length > 1 ? (
        <div role="group" aria-label={copy.pay.duration as string}>
          <p className="text-base font-medium text-foreground">{copy.pay.duration}</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {prices.map((one) => (
              <ChoiceButton
                key={one.plan}
                selected={one.plan === plan}
                note={one.amount != null ? formatMoney(one.amount, language) : undefined}
                onClick={() => {
                  setPlan(one.plan);
                  setRefused(null);
                }}
              >
                {lengthOf(one)}
              </ChoiceButton>
            ))}
          </div>
        </div>
      ) : null}

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
            {[fill(copy.pay.step1 as string, { app: name }), copy.pay.step2].map((line, index) => (
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
              setRefused(null);
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

          {refused ? (
            <div className="rounded-xl border-2 border-destructive/60 bg-destructive/5 p-4" role="alert">
              <p className="text-base font-semibold text-destructive">{copy.pay.problemTitle}</p>
              <ul className="mt-2 space-y-2">
                {refused.map((reason, index) => (
                  <li key={index} className="text-base leading-relaxed text-foreground">
                    {reason}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-base text-muted-foreground">{copy.pay.problemHelp}</p>
            </div>
          ) : null}
          {error ? (
            <p className="text-base leading-relaxed text-destructive" role="alert">{error}</p>
          ) : null}

          <div>
            <Button type="button" variant="accent" onClick={() => void send()} disabled={busy}>
              {busy ? copy.pay.checking : copy.pay.send}
            </Button>
            {busy ? (
              <p className="mt-2 text-base text-muted-foreground" role="status">{copy.pay.checkingNote}</p>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

/* What came back from sending a screenshot, for the page to say. */
export type Sent = {
  read: ReadBack | null;
  confirmed: boolean;
  /* What it paid for and until when, when the server said. */
  plan?: string | null;
  endsAt?: string | null;
  /* Sent beyond the price of what it bought, in minor units: owed back to him. */
  refundDue?: number;
};

/*
 * Sending the screenshot, and nothing else: the page the software's code
 * opens once he has paid from his phone (Adel, 2026-10-03). He chooses no
 * plan and no app. The amount on the screenshot says whether it is a year or
 * six months, and the number it went to says which app. For an owner who
 * has not paid yet, how to, under it, in the same words as the software.
 */
export function SendScreenshot({
  copy,
  language,
  serial,
  prices,
  payTo,
  onSent,
}: {
  copy: BuilderCopy;
  language: AppLanguage;
  serial: string;
  /* The lengths on offer with their prices: what the amount is matched against. */
  prices: Price[];
  payTo: PayTo[];
  onSent: (sent: Sent) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refused, setRefused] = useState<string[] | null>(null);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (payTo.length === 0) {
    return <p className="text-base leading-relaxed text-muted-foreground">{copy.pay.noNumber}</p>;
  }
  const priced = prices.filter((one) => one.amount != null);
  if (priced.length === 0) {
    return <p className="text-base leading-relaxed text-muted-foreground">{copy.pay.soonPrice}</p>;
  }

  async function send() {
    if (!file) return setError(copy.pay.errorImage as string);
    setError(null);
    setRefused(null);
    setBusy(true);
    try {
      const form = new FormData();
      form.set("number", serial);
      form.set("image", await prepareScreenshot(file), "screenshot.jpg");
      const response = await fetch("/api/builder/payment/serial", { method: "POST", body: form });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body) return setError(copy.pay.errorSend as string);
      if (body.decision === "rejected_auto") return setRefused(explain(copy, body.failures ?? [], language));
      onSent({
        read: body.read ?? null,
        confirmed: body.decision === "confirmed",
        plan: typeof body.plan === "string" ? body.plan : null,
        endsAt: typeof body.endsAt === "string" ? body.endsAt : null,
        refundDue: typeof body.refundDue === "number" ? body.refundDue : 0,
      });
    } catch (caught) {
      setError(caught instanceof ScreenshotError ? (copy.pay.errorImage as string) : (copy.pay.errorSend as string));
    } finally {
      setBusy(false);
    }
  }

  const amounts = anyOf(
    priced.map((one) =>
      fill(copy.pay.planAmount as string, {
        amount: formatMoney(one.amount as number, language),
        plan: (one.plan === "semiannual" ? copy.pay.sixMonths : copy.pay.year) as string,
      })
    ),
    language
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{copy.pay.uploadHeading}</h2>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">{copy.pay.uploadIntro}</p>
      </div>

      <input
        ref={input}
        type="file"
        accept={ACCEPTED_IMAGES.join(",")}
        className="sr-only"
        onChange={(event) => {
          setFile(event.target.files?.[0] ?? null);
          setError(null);
          setRefused(null);
        }}
      />
      <div>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt={copy.pay.screenshotAlt as string}
            className="mb-3 max-h-72 rounded-lg border border-border object-contain"
          />
        ) : null}
        {/* Choosing is the one thing to do until there is a picture; then sending is. */}
        <Button type="button" variant={file ? "outline" : "accent"} onClick={() => input.current?.click()}>
          {file ? copy.pay.replace : copy.pay.choose}
        </Button>
      </div>

      {refused ? (
        <div className="rounded-xl border-2 border-destructive/60 bg-destructive/5 p-4" role="alert">
          <p className="text-base font-semibold text-destructive">{copy.pay.problemTitle}</p>
          <ul className="mt-2 space-y-2">
            {refused.map((reason, index) => (
              <li key={index} className="text-base leading-relaxed text-foreground">
                {reason}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-base text-muted-foreground">{copy.pay.problemHelp}</p>
        </div>
      ) : null}
      {error ? (
        <p className="text-base leading-relaxed text-destructive" role="alert">{error}</p>
      ) : null}

      {file ? (
        <div>
          <Button type="button" variant="accent" onClick={() => void send()} disabled={busy}>
            {busy ? copy.pay.checking : copy.pay.send}
          </Button>
          {busy ? (
            <p className="mt-2 text-base text-muted-foreground" role="status">{copy.pay.checkingNote}</p>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-xl border border-border p-4">
        <p className="text-base font-medium text-foreground">{copy.pay.notPaidTitle}</p>
        <p className="mt-1 text-base leading-relaxed text-muted-foreground">
          {fill(copy.pay.notPaidBody as string, {
            amounts,
            number: [...new Set(payTo.map((one) => one.number))].join(" / "),
            apps: anyOf(payTo.map((one) => appName(one.app, language)), language),
            serial,
          })}
        </p>
      </div>
    </div>
  );
}

/* "Bankily, Masrvi or Click", the way each language says it. */
function anyOf(items: string[], language: AppLanguage): string {
  return new Intl.ListFormat(language, { type: "disjunction" }).format(items);
}

/*
 * After sending: confirmed already, or with a person; and, when the
 * screenshot was read, what was read off it, so a misreading is seen by the
 * one person who knows what he sent. Confirmed, it says what was bought: a
 * year or six months, and until when.
 */
export function PaymentReceived({
  copy,
  language,
  read,
  confirmed = false,
  plan = null,
  endsAt = null,
  refundDue = 0,
  serial = null,
}: {
  copy: BuilderCopy;
  language: AppLanguage;
  read: ReadBack | null;
  confirmed?: boolean;
  plan?: string | null;
  endsAt?: string | null;
  refundDue?: number;
  /* For the message asking for the refund, so we know whose it is. */
  serial?: string | null;
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
      {/* Said at once and plainly: it went through, or it is with a person. */}
      <div
        role="status"
        className={`rounded-xl border-2 p-4 ${confirmed ? "border-emerald-600/60 bg-emerald-600/5" : "border-border"}`}
      >
        <p className={`font-semibold ${confirmed ? "text-xl text-emerald-700 dark:text-emerald-400" : "text-lg text-foreground"}`}>
          {!confirmed
            ? copy.pay.receivedTitle
            : plan === "annual"
              ? copy.pay.successYear
              : plan === "semiannual"
                ? copy.pay.successSixMonths
                : copy.pay.successTitle}
        </p>
        <p className="mt-1 text-base leading-relaxed text-foreground">
          {!confirmed
            ? copy.pay.receivedBody
            : endsAt
              ? `${fill(copy.pay.activeUntil as string, { date: new Date(endsAt).toLocaleDateString(language, { timeZone: "UTC" }) })} ${copy.pay.reopensSoon}`
              : copy.pay.confirmedNow}
        </p>
      </div>
      {confirmed && refundDue > 0 && read?.amount != null ? (
        <Refund copy={copy} language={language} sent={read.amount} extra={refundDue} plan={plan} serial={serial} reference={read.reference} />
      ) : null}
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

/*
 * Sent more than the price of what it bought (2026-10-03): the time is his
 * already, and what is left over is his to get back. One press opens WhatsApp
 * with a message that says whose payment it is and how much, so the person
 * reading it has nothing to ask.
 */
function Refund({
  copy,
  language,
  sent,
  extra,
  plan,
  serial,
  reference,
}: {
  copy: BuilderCopy;
  language: AppLanguage;
  sent: number;
  extra: number;
  plan: string | null;
  serial: string | null;
  reference: string | null;
}) {
  const words = {
    sent: formatMoney(sent, language),
    extra: formatMoney(extra, language),
    price: formatMoney(sent - extra, language),
    plan: (plan === "semiannual" ? copy.pay.sixMonths : copy.pay.year) as string,
    serial: serial ?? "",
    reference: reference ?? "",
  };
  const message = fill(copy.pay.refundMessage as string, words);
  return (
    <div className="rounded-xl border-2 border-amber-500/60 bg-amber-500/5 p-4" role="note">
      <p className="text-base font-semibold text-foreground">{fill(copy.pay.refundTitle as string, words)}</p>
      <p className="mt-1 text-base leading-relaxed text-foreground">{fill(copy.pay.refundBody as string, words)}</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <Button href={`${organization.whatsappUrl}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" variant="accent">
          {copy.pay.refundWhatsapp}
        </Button>
        <Button href={`/${language}/contact`} variant="outline">
          {copy.pay.refundContact}
        </Button>
      </div>
    </div>
  );
}

/** Each rule that failed, in the owner's words, naming what to do about it. */
function explain(
  copy: BuilderCopy,
  failures: CheckFailure[],
  language: AppLanguage
): string[] {
  const money = (minor: unknown) => formatMoney(Number(minor ?? 0), language).replace(" MRU", "");
  /* One price, or every price it could have been: "15 000 or 7 500". */
  const amounts = (minor: unknown) => (Array.isArray(minor) ? anyOf(minor.map(money), language) : money(minor));
  const day = (iso: unknown) => new Date(`${String(iso)}T00:00:00Z`).toLocaleDateString(language, { timeZone: "UTC" });
  return failures.map((failure) => {
    switch (failure.code) {
      case "not_receipt":
        return copy.pay.failNotReceipt as string;
      case "reference_used":
        return copy.pay.failReferenceUsed as string;
      case "image_used":
        return copy.pay.failImageUsed as string;
      case "wrong_amount":
        return fill((Array.isArray(failure.expected) ? copy.pay.failAmountEither : copy.pay.failAmount) as string, {
          found: money(failure.found),
          expected: amounts(failure.expected),
        });
      case "amount_too_low":
        return fill(copy.pay.failAmountTooLow as string, { found: money(failure.found), expected: money(failure.expected) });
      case "amount_unread":
        return fill(copy.pay.failAmountUnread as string, { expected: amounts(failure.expected) });
      case "wrong_recipient":
        return fill(copy.pay.failRecipient as string, { expected: String(failure.expected ?? "") });
      case "recipient_unread":
        return fill(copy.pay.failRecipientUnread as string, { expected: String(failure.expected ?? "") });
      case "wrong_date":
        return fill(copy.pay.failDate as string, { found: day(failure.found) });
      case "date_unread":
        return copy.pay.failDateUnread as string;
    }
  });
}
