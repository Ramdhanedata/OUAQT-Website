"use client";

import { useState } from "react";
import type { AppLanguage } from "@/app-ui/config";
import type { Pack } from "@/app-ui/packs";
import type { BuilderCopy } from "@/builder/copy";
import { browserClient } from "@/builder/db/client";
import type { DraftAnswers } from "@/builder/draft/store";
import type { ImportedProduct } from "@/builder/import/parse";
import { Button } from "./owner-button";
import { fill } from "@/lib/utils";
import { Field, TextInput } from "./fields";
import type { StaffMember } from "./step-products";

/*
 * Step 4: an account, then the number that makes it his.
 *
 * He has been answering questions for a quarter of an hour by now, so this
 * asks for the least that will let him come back: a phone number and a
 * password. No code by SMS, because that means an SMS provider, a cost per
 * message, and an owner stuck at a checkpoint with no signal.
 *
 * The phone number becomes the login. Supabase wants an address, so the
 * number is turned into one; he never sees it and never types it.
 */

/*
 * The phone number becomes a login address, because Supabase signs people in
 * with one and phone sign-in would mean paying for an SMS on every account.
 * The owner never sees it and never types it.
 *
 * The domain has to exist in DNS or Supabase refuses the address outright,
 * which rules out ouaqt.com until it is pointed somewhere. It is a variable
 * so it can be changed before real owners exist. Changing it afterwards locks
 * every one of them out, so it belongs in the launch checklist.
 */
const PHONE_DOMAIN =
  process.env.NEXT_PUBLIC_ACCOUNT_EMAIL_DOMAIN?.trim() || "ouaqtcom.vercel.app";
const SHORTEST_PASSWORD = 8; // not-a-rule: a floor, not a policy anyone administers

export function loginFor(phone: string): string {
  return `${phone.replace(/\D/g, "")}@${PHONE_DOMAIN}`;
}

export function isPhone(input: string): boolean {
  const digits = input.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

type Installers = { windows: string | null; mac: string | null };
type Tutorials = { windows: string | null; mac: string | null };

export function StepAccount({
  copy,
  language,
  pack,
  answers,
  products,
  staff,
  termsHref,
  installers,
  tutorials,
  serial,
  onSerial,
}: {
  copy: BuilderCopy;
  language: AppLanguage;
  pack: Pack;
  answers: DraftAnswers;
  products: ImportedProduct[];
  staff: StaffMember[];
  termsHref: string;
  installers: Installers;
  tutorials: Tutorials;
  serial: string | null;
  onSerial: (serial: string) => void;
}) {
  if (serial) {
    return (
      <SerialPanel
        copy={copy}
        serial={serial}
        installers={installers}
        tutorials={tutorials}
      />
    );
  }

  return (
    <AccountForm
      copy={copy}
      language={language}
      pack={pack}
      answers={answers}
      products={products}
      staff={staff}
      termsHref={termsHref}
      onSerial={onSerial}
    />
  );
}

function AccountForm({
  copy,
  language,
  pack,
  answers,
  products,
  staff,
  termsHref,
  onSerial,
}: {
  copy: BuilderCopy;
  language: AppLanguage;
  pack: Pack;
  answers: DraftAnswers;
  products: ImportedProduct[];
  staff: StaffMember[];
  termsHref: string;
  onSerial: (serial: string) => void;
}) {
  const [phone, setPhone] = useState(answers.phone ?? "");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    if (!isPhone(phone)) return setError(copy.account.errorPhone as string);
    if (password.length < SHORTEST_PASSWORD) {
      return setError(copy.account.errorPassword as string);
    }
    if (!accepted) return setError(copy.account.errorTerms as string);

    setError(null);
    setBusy(true);

    try {
      const supabase = await browserClient();
      if (!supabase) return setError(copy.account.errorGeneric as string);

      const email = loginFor(phone);
      const { data: current } = await supabase.auth.getSession();

      /*
       * Three ways in, and picking the wrong one is how an owner gets told
       * his own number is taken:
       *
       *   anonymous session   he started without an account, and his draft
       *                       belongs to that session. Updating it keeps the
       *                       same user, so nothing he answered is orphaned.
       *   real session        he is already signed in. Nothing to create.
       *   no session          a new account.
       */
      const user = current.session?.user;
      const signedUp = user?.is_anonymous
        ? await supabase.auth.updateUser({ email, password })
        : user
          ? { error: null }
          : await supabase.auth.signUp({ email, password });

      if (signedUp.error) {
        /*
         * Supabase says this several ways depending on which call refused:
         * "User already registered", "email address is already in use", and a
         * bare 422 on an account that exists. They all mean one thing to the
         * owner, and it is not "something went wrong".
         */
        const message = signedUp.error.message.toLowerCase();
        const taken =
          message.includes("already") ||
          message.includes("registered") ||
          message.includes("in use") ||
          signedUp.error.status === 422;

        setError(
          taken
            ? (copy.account.errorTaken as string)
            : (copy.account.errorGeneric as string)
        );
        return;
      }

      const response = await fetch("/api/builder/finish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pack,
          language,
          business: {
            nameLatin: answers.nameLatin ?? "",
            nameArabic: answers.nameArabic || undefined,
            phone: answers.phone || undefined,
            address: answers.address || undefined,
          },
          answers: answers.interview ?? {},
          patched: answers.patched,
          staff,
          products,
        }),
      });

      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.serial) {
        setError(copy.account.errorGeneric as string);
        return;
      }
      onSerial(body.serial);
    } catch {
      setError(copy.account.errorGeneric as string);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {copy.account.heading}
        </h2>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          {copy.account.intro}
        </p>
      </div>

      <Field label={copy.account.phone}>
        <TextInput
          dir="ltr"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={setPhone}
        />
      </Field>

      <Field label={copy.account.password} help={copy.account.passwordHelp}>
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="min-h-[48px] w-full rounded-lg border border-border bg-background px-4 text-base text-foreground outline-none focus:border-foreground"
        />
      </Field>

      <label className="flex min-h-[48px] items-start gap-3">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
          className="mt-1 h-6 w-6 shrink-0"
        />
        <span className="text-base leading-relaxed text-foreground">
          {copy.account.terms}{" "}
          <a href={termsHref} target="_blank" rel="noreferrer" className="underline">
            {copy.account.termsLink}
          </a>
        </span>
      </label>

      {error ? (
        <p className="text-base leading-relaxed text-destructive">{error}</p>
      ) : null}

      <Button type="button" variant="accent" onClick={() => void create()} disabled={busy}>
        {busy ? copy.account.creating : copy.account.create}
      </Button>
    </div>
  );
}

function SerialPanel({
  copy,
  serial,
  installers,
  tutorials,
}: {
  copy: BuilderCopy;
  serial: string;
  installers: Installers;
  tutorials: Tutorials;
}) {
  const [copied, setCopied] = useState(false);
  const address = typeof window === "undefined" ? "" : window.location.origin;
  const share = `https://wa.me/?text=${encodeURIComponent(
    fill(copy.serial.shareMessage as string, { serial, url: address })
  )}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {copy.serial.heading}
        </h2>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          {copy.serial.intro}
        </p>
      </div>

      <p
        dir="ltr"
        className="rounded-xl border border-border bg-muted/40 py-6 text-center font-mono text-3xl font-semibold tracking-[0.2em] text-foreground"
      >
        {serial}
      </p>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void navigator.clipboard?.writeText(serial);
            setCopied(true);
          }}
        >
          {copied ? copy.serial.copied : copy.serial.copy}
        </Button>
        <a
          href={share}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-[48px] items-center rounded-lg border border-border px-4 text-base text-foreground"
        >
          {copy.serial.share}
        </a>
      </div>

      {installers.windows || installers.mac ? (
        <div className="flex flex-wrap gap-3">
          {installers.windows ? (
            <a
              href={installers.windows}
              className="inline-flex min-h-[48px] items-center rounded-lg bg-accent px-5 text-base font-medium text-accent-foreground"
            >
              {copy.serial.windows}
            </a>
          ) : null}
          {installers.mac ? (
            <a
              href={installers.mac}
              className="inline-flex min-h-[48px] items-center rounded-lg border border-border px-5 text-base text-foreground"
            >
              {copy.serial.mac}
            </a>
          ) : null}
        </div>
      ) : (
        <p className="text-base leading-relaxed text-muted-foreground">
          {copy.serial.soon}
        </p>
      )}

      {/* On a phone there is nothing to install, so say where to go instead. */}
      <p className="text-base leading-relaxed text-muted-foreground wizard:hidden">
        {copy.serial.onPhone}{" "}
        <bdi dir="ltr" className="text-foreground">
          {address}
        </bdi>
      </p>

      <div className="space-y-2">
        {tutorials.windows ? (
          <a
            href={tutorials.windows}
            target="_blank"
            rel="noreferrer"
            className="block min-h-[48px] text-base text-muted-foreground underline decoration-border underline-offset-4"
          >
            {copy.serial.tutorialWindows}
          </a>
        ) : null}
        {tutorials.mac ? (
          <a
            href={tutorials.mac}
            target="_blank"
            rel="noreferrer"
            className="block min-h-[48px] text-base text-muted-foreground underline decoration-border underline-offset-4"
          >
            {copy.serial.tutorialMac}
          </a>
        ) : null}
      </div>
    </div>
  );
}
