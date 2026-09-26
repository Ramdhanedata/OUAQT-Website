"use client";

import { machineOf, type Machine } from "./machine";
import { InstallGuide } from "./install-guide";
import { useInstallTarget } from "./install-target";
import { useEffect, useState } from "react";
import type { AppLanguage } from "@/app-ui/config";
import type { Pack } from "@/app-ui/packs";
import type { BuilderCopy } from "@/builder/copy";
import { browserClient } from "@/builder/db/client";
import type { DraftAnswers } from "@/builder/draft/store";
import type { ImportedProduct } from "@/builder/import/parse";
import { Button } from "./owner-button";
import { cn, fill } from "@/lib/utils";
import { localisedHref } from "@/lib/i18n/routes";
import { Field, TextInput } from "./fields";
import type { StaffMember } from "./step-products";
import { InstallHelp } from "./install-help";

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

type Installers = { windows: string | null; mac: string | null; macApple?: string | null };
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
  installers: Record<Pack, Installers>;
  tutorials: Tutorials;
  serial: string | null;
  onSerial: (serial: string) => void;
}) {
  if (serial) {
    return (
      <SerialPanel
        copy={copy}
        language={language}
        serial={serial}
        installers={installers[pack]}
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

export function SerialPanel({
  copy,
  language,
  serial,
  installers,
  tutorials,
  link,
}: {
  copy: BuilderCopy;
  language: AppLanguage;
  serial: string;
  installers: Installers;
  tutorials: Tutorials;
  /*
   * A one-click link made already, by the path from the computer, which
   * has no account to ask for one with.
   */
  link?: string | null;
}) {
  const [machine, setMachine] = useState<Machine>("other");
  useEffect(() => setMachine(machineOf()), []);
  const { target, detected, choose } = useInstallTarget();

  const anyInstaller = Boolean(installers.windows || installers.mac);
  const href =
    target === "windows" ? installers.windows : target === "mac-apple" ? installers.macApple ?? installers.mac : installers.mac;
  const label =
    target === "windows" ? copy.install.downloadWindows : target === "mac-apple" ? copy.install.downloadMacApple : copy.install.downloadMacIntel;

  /*
   * Any computer: which one he is installing on, the download for it, and
   * (on a narrow screen, where there is no room beside it) how to install.
   * On a wide screen the guide sits in the space the live preview had.
   * The serial is still here, smaller, as the thing to keep for a second
   * computer. A phone gets the serial to take to the computer instead.
   */
  if (machine !== "phone" && anyInstaller) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground">{copy.serial.pcHeading}</h2>

        <fieldset>
          <legend className="text-base font-medium text-foreground">{copy.install.question}</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {(
              [
                ["windows", copy.install.windows, copy.install.windowsHint, Boolean(installers.windows)],
                ["mac-intel", copy.install.macIntel, copy.install.macIntelHint, Boolean(installers.mac)],
                ["mac-apple", copy.install.macApple, copy.install.macAppleHint, Boolean(installers.macApple ?? installers.mac)],
              ] as const
            )
              .filter(([, , , available]) => available)
              .map(([value, name, hint]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={target === value}
                  onClick={() => choose(value)}
                  className={cn(
                    "flex min-h-[88px] flex-col items-start gap-1 rounded-xl border-2 p-3 text-start transition-colors",
                    target === value ? "border-foreground bg-surface" : "border-border hover:border-foreground/40"
                  )}
                >
                  <span className="text-base font-semibold text-foreground">{name}</span>
                  <span className="text-sm leading-snug text-muted-foreground">{hint}</span>
                  {detected === value ? (
                    <span className="mt-1 rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-foreground">
                      {copy.install.detected}
                    </span>
                  ) : null}
                </button>
              ))}
          </div>
          {target !== "windows" ? <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{copy.install.whichMac}</p> : null}
        </fieldset>

        {href ? (
          <a
            href={href}
            className="flex min-h-[56px] w-full items-center justify-center rounded-lg bg-accent px-5 text-lg font-semibold text-accent-foreground"
          >
            {label}
          </a>
        ) : null}

        <div className="wizard:hidden">
          <InstallGuide copy={copy} target={target} serial={serial} compact />
        </div>

        <OpenMySoftware copy={copy} mac={target !== "windows"} link={link ?? null} />

        <div className="rounded-xl border border-border p-4">
          <p className="text-base leading-relaxed text-muted-foreground">{copy.serial.keepNumber}</p>
          <p
            dir="ltr"
            className="mt-2 font-mono text-xl font-semibold tracking-[0.15em] text-foreground"
          >
            {serial}
          </p>
        </div>

        <Tutorials copy={copy} tutorials={tutorials} />
      </div>
    );
  }

  return (
    <PhoneOrSoon
      copy={copy}
      language={language}
      serial={serial}
      installers={installers}
      tutorials={tutorials}
      showDownloads={machine === "other"}
    />
  );
}

/*
 * "Ouvrir mon logiciel": a one-time link for the app that was just installed.
 *
 * Made when he presses the button, not before, so its twenty-four hours start
 * when he is ready. The link itself never appears on the page: it is handed
 * straight to the browser to open. Whatever goes wrong, the sentence under
 * the button tells him what to do instead, and the app itself falls back to
 * asking for the serial, so nobody is left stuck.
 */
function OpenMySoftware({ copy, mac, link }: { copy: BuilderCopy; mac: boolean; link: string | null }) {
  const [state, setState] = useState<"idle" | "opening" | "failed">("idle");

  async function open() {
    setState("opening");
    if (link) {
      window.location.href = link;
      setState("idle");
      return;
    }
    try {
      const response = await fetch("/api/builder/activation-token", { method: "POST" });
      const body = (await response.json().catch(() => null)) as { link?: string } | null;
      if (!response.ok || !body?.link?.startsWith("ouaqt://")) {
        setState("failed");
        return;
      }
      window.location.href = body.link;
      setState("idle");
    } catch {
      setState("failed");
    }
  }

  return (
    <div className="space-y-3 rounded-xl border-2 border-foreground p-5">
      <p className="text-base font-medium text-foreground">{copy.serial.afterInstall}</p>
      {mac ? (
        <p className="text-base leading-relaxed text-muted-foreground">{copy.serial.macOpenFirst}</p>
      ) : null}
      <Button
        type="button"
        variant="primary"
        className="min-h-[56px] w-full text-lg"
        disabled={state === "opening"}
        onClick={() => void open()}
      >
        {state === "opening" ? copy.serial.opening : copy.serial.open}
      </Button>
      <p className="text-base leading-relaxed text-muted-foreground" role={state === "failed" ? "alert" : undefined}>
        {state === "failed" ? copy.serial.openFailed : copy.serial.openFallback}
      </p>
    </div>
  );
}

/*
 * A phone, or a trade with nothing to download yet. On a phone there is
 * nothing to install, so it shows the serial and where to go on the shop
 * computer. With no installer yet, it says so plainly.
 */
function PhoneOrSoon({
  copy,
  language,
  serial,
  installers,
  tutorials,
  showDownloads,
}: {
  copy: BuilderCopy;
  language: AppLanguage;
  serial: string;
  installers: Installers;
  tutorials: Tutorials;
  showDownloads: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  /* Where he signs in on the shop PC: his account page, which has the downloads. */
  const address = `${origin}${localisedHref(language, "account")}`;
  const share = `https://wa.me/?text=${encodeURIComponent(
    fill(copy.serial.shareMessage as string, { serial, url: address })
  )}`;
  const anyInstaller = Boolean(installers.windows || installers.mac);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{copy.serial.heading}</h2>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">{copy.serial.intro}</p>
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

      {!anyInstaller ? (
        /*
         * No installer yet, and the owner must not be left wondering where his
         * software went. This was a grey line, and the first person to reach
         * step 4 on the preview did not see it.
         */
        <div role="status" className="rounded-xl border-2 border-foreground p-5">
          <p className="text-lg font-medium leading-relaxed text-foreground">{copy.serial.soon}</p>
        </div>
      ) : showDownloads ? (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-3">
            {installers.windows ? (
              <a
                href={installers.windows}
                className="inline-flex min-h-[48px] items-center rounded-lg bg-accent px-5 text-base font-medium text-accent-foreground"
              >
                {copy.serial.windows}
              </a>
            ) : null}
            {installers.macApple ? (
              <a
                href={installers.macApple}
                className="inline-flex min-h-[48px] items-center rounded-lg border border-border px-5 text-base text-foreground"
              >
                {copy.serial.macApple}
              </a>
            ) : null}
            {installers.mac ? (
              <a
                href={installers.mac}
                className="inline-flex min-h-[48px] items-center rounded-lg border border-border px-5 text-base text-foreground"
              >
                {installers.macApple ? copy.serial.macIntel : copy.serial.mac}
              </a>
            ) : null}
          </div>
          <InstallHelp copy={copy} first="windows" />
        </div>
      ) : (
        <div className="rounded-xl border-2 border-foreground p-5">
          <p className="text-base leading-relaxed text-foreground">{copy.serial.onPhone}</p>
          <p dir="ltr" className="mt-2 break-all text-lg font-medium text-foreground">
            {address}
          </p>
        </div>
      )}

      <Tutorials copy={copy} tutorials={tutorials} />
    </div>
  );
}

function Tutorials({ copy, tutorials }: { copy: BuilderCopy; tutorials: Tutorials }) {
  if (!tutorials.windows && !tutorials.mac) return null;
  return (
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
  );
}
