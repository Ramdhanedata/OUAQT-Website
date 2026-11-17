"use client";

import { PHONE_DOMAIN } from "./login-domain";
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
import { fill } from "@/lib/utils";
import { localisedHref } from "@/lib/i18n/routes";
import { Field, TextInput } from "./fields";

/* Names a draft may still carry from when the builder asked for the staff. */
type StaffMember = { name: string; role: "manager" | "cashier" };
import { InstallHelp } from "./install-help";
import { PhoneApp } from "./phone-app";
import { countDownload } from "@/lib/site-count";
import { Download } from "lucide-react";

/*
 * The last step: his software, and, only when no number could be given, an
 * account first.
 *
 * The account asks for the least that will let him come back: a phone number
 * and a password. No code by SMS, because that means an SMS provider, a cost per
 * message, and an owner stuck at a checkpoint with no signal.
 *
 * The phone number becomes the login. Supabase wants an address, so the
 * number is turned into one; he never sees it and never types it.
 */

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
        pack={pack}
        shop={(language === "ar" && answers.nameArabic) || answers.nameLatin || ""}
        installers={installers[pack]}
        tutorials={tutorials}
        makeShop={{ products }}
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

/*
 * Tells the website which system a download is for, the moment it starts.
 * The token it makes keeps a mark of this connection, so the software,
 * starting here, opens its shop by itself (see 0024). Nothing waits on it:
 * if it fails, the software asks for the serial as it always has. The press
 * is also counted, by system and trade, for the overview's downloads.
 */
export function registerDownload(platform: "windows" | "mac", pack?: Pack) {
  countDownload(platform, pack);
  void fetch("/api/builder/activation-token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ platform }),
    keepalive: true,
  }).catch(() => undefined);
}

/*
 * The shop, from its number, on the computer that downloads: what the
 * "I already have my serial number" page does on opening (resume.tsx), here
 * on the press of the download. The same number always finds the same shop,
 * so a second press only leaves a second mark for it. Not keepalive: a
 * product list can be larger than a closing page may send, and a download
 * does not close the page.
 */
function makeShopFrom(serial: string, products: ImportedProduct[]) {
  void fetch("/api/builder/configuration-code/shop", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ number: serial, products }),
  }).catch(() => undefined);
}

/*
 * The download, once there is a serial: which computer, the file for it, and
 * how to install, warnings included. There is nothing to type after: the
 * software opens its shop by itself, made at the latest by the press of the
 * download (makeShop). The serial stays below, smaller, for a
 * second computer or a reinstall. A phone gets the serial to take to the
 * computer instead.
 */
export function SerialPanel({
  copy,
  language,
  serial,
  pack,
  shop,
  installers,
  tutorials,
  guideAlways = false,
  makeShop,
}: {
  copy: BuilderCopy;
  language: AppLanguage;
  serial: string;
  pack: Pack;
  shop: string;
  installers: Installers;
  tutorials: Tutorials;
  /* The install guide on every screen: no aside beside a resumed download to hold it. */
  guideAlways?: boolean;
  /*
   * Step 4: only the number exists, not the shop. The download makes it, with
   * the products he kept, and so leaves the mark of this connection that the
   * software looks for when it first starts (0024): it opens by itself, as
   * the guide says. A resumed download made its shop on opening: nothing.
   */
  makeShop?: { products: ImportedProduct[] };
}) {
  const [machine, setMachine] = useState<Machine>("other");
  useEffect(() => setMachine(machineOf()), []);
  const { target, chip, choose } = useInstallTarget();

  const anyInstaller = Boolean(installers.windows || installers.mac);
  const appleFile = installers.macApple ?? installers.mac;
  /* A Mac that says which chip it has gets its own file; otherwise the Apple chip, the Mac of the last five years, with the other one link away. */
  const macFile = chip === "intel" ? installers.mac : appleFile;
  const otherMac = chip ? null : installers.mac && appleFile !== installers.mac ? installers.mac : null;
  const href = target === "windows" ? installers.windows : macFile;

  if (machine !== "phone" && anyInstaller) {
    /* The other system's file, for the owner who builds here and installs on the shop's computer. */
    const other = target === "windows" ? "mac" : "windows";
    const otherHref = other === "windows" ? installers.windows : appleFile;
    const downloaded = (platform: "windows" | "mac") => {
      registerDownload(platform, pack);
      if (makeShop) makeShopFrom(serial, makeShop.products);
    };

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">{copy.serial.pcHeading}</h2>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">{copy.serial.pcIntro}</p>
        </div>

        {/*
          * One button, for the computer he is on: nothing to choose first.
          * The other system is one line below, and choosing it moves the
          * install guide with it.
          */}
        {href ? (
          <a
            href={href}
            onClick={() => downloaded(target)}
            className="flex min-h-[60px] w-full items-center justify-center gap-2 rounded-full bg-accent px-6 text-lg font-semibold text-accent-foreground"
          >
            <Download className="h-5 w-5" />
            {target === "windows" ? copy.install.downloadWindows : copy.install.downloadMac}
          </a>
        ) : null}
        <div className="-mt-2 space-y-1">
          {otherHref ? (
            <a
              href={otherHref}
              onClick={() => {
                choose(other);
                downloaded(other);
              }}
              className="flex min-h-[44px] items-center text-base text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
            >
              {other === "mac" ? copy.serial.alsoMac : copy.serial.alsoWindows}
            </a>
          ) : null}
          {target === "mac" && otherMac ? (
            <a
              href={otherMac}
              onClick={() => downloaded("mac")}
              className="flex min-h-[44px] items-center text-base text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
            >
              {copy.serial.otherMacIntel}
            </a>
          ) : null}
        </div>
        {href ? <TermsNote copy={copy} language={language} /> : null}

        <div className={guideAlways ? undefined : "wizard:hidden"}>
          <InstallGuide copy={copy} target={target} chip={chip} pack={pack} shop={shop} compact />
        </div>

        <div className="rounded-xl border border-border p-4">
          <p className="text-base leading-relaxed text-muted-foreground">{copy.serial.keepNumber}</p>
          <p
            dir="ltr"
            className="mt-2 font-mono text-xl font-semibold tracking-[0.15em] text-foreground"
          >
            {serial}
          </p>
        </div>

        <PhoneApp copy={copy} serial={serial} />

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
      onPhone={machine === "phone"}
      onDownload={makeShop ? () => makeShopFrom(serial, makeShop.products) : undefined}
    />
  );
}

/*
 * The terms, where the owner meets them. Most never see the account form and
 * its box: the serial comes after the questions and the download straight
 * after it, so the download is where the terms are put in front of him.
 */
function TermsNote({ copy, language }: { copy: BuilderCopy; language: AppLanguage }) {
  const [before, after = ""] = (copy.serial.termsNote as string).split("{terms}");
  return (
    <p className="text-sm leading-relaxed text-muted-foreground">
      {before}
      <a href={`/${language}/terms`} target="_blank" rel="noreferrer" className="underline underline-offset-4">
        {copy.serial.termsLink}
      </a>
      {after}
    </p>
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
  onPhone,
  onDownload,
}: {
  copy: BuilderCopy;
  language: AppLanguage;
  serial: string;
  installers: Installers;
  tutorials: Tutorials;
  showDownloads: boolean;
  /* A phone: its own app first, one tap away, and the computer after. */
  onPhone: boolean;
  onDownload?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  /*
   * The site as he would type it on the shop computer: www.ouaqt.com, where
   * "I already have my serial number" sits under the first button. The link
   * he shares to himself goes one step further, to the box for the number.
   */
  const site = typeof window === "undefined" ? "" : window.location.host;
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const share = `https://wa.me/?text=${encodeURIComponent(
    fill(copy.serial.shareMessage as string, { serial, url: `${origin}${localisedHref(language, "builder")}?serial=1` })
  )}`;
  const [before, after = ""] = fill(copy.serial.onPhone as string, { have: copy.code.have }).split("{site}");
  const anyInstaller = Boolean(installers.windows || installers.mac);

  return (
    <div className="space-y-6">
      {/* First, not last: an owner on a computer came for a download, and must not have to scroll to learn why there is none. */}
      {!anyInstaller ? (
        <div role="status" className="rounded-xl border-2 border-foreground p-5">
          <p className="text-lg font-medium leading-relaxed text-foreground">{copy.serial.soon}</p>
        </div>
      ) : null}
      {onPhone ? <PhoneApp copy={copy} serial={serial} lead /> : null}

      <div className={onPhone ? "border-t border-border pt-6" : undefined}>
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
          className="inline-flex min-h-[48px] items-center rounded-full border border-border px-5 text-base text-foreground"
        >
          {copy.serial.share}
        </a>
      </div>

      {onPhone ? null : <PhoneApp copy={copy} serial={serial} />}

      {!anyInstaller ? null : showDownloads ? (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-3">
            {installers.windows ? (
              <a
                href={installers.windows}
                onClick={() => {
                  registerDownload("windows");
                  onDownload?.();
                }}
                className="inline-flex min-h-[48px] items-center rounded-lg bg-accent px-5 text-base font-medium text-accent-foreground"
              >
                {copy.serial.windows}
              </a>
            ) : null}
            {installers.macApple ? (
              <a
                href={installers.macApple}
                onClick={() => {
                  registerDownload("mac");
                  onDownload?.();
                }}
                className="inline-flex min-h-[48px] items-center rounded-lg border border-border px-5 text-base text-foreground"
              >
                {copy.serial.macApple}
              </a>
            ) : null}
            {installers.mac ? (
              <a
                href={installers.mac}
                onClick={() => {
                  registerDownload("mac");
                  onDownload?.();
                }}
                className="inline-flex min-h-[48px] items-center rounded-lg border border-border px-5 text-base text-foreground"
              >
                {installers.macApple ? copy.serial.macIntel : copy.serial.mac}
              </a>
            ) : null}
          </div>
          <TermsNote copy={copy} language={language} />
          <InstallHelp copy={copy} first="windows" />
        </div>
      ) : (
        <div className="rounded-xl border border-border p-5">
          <p className="text-base leading-relaxed text-foreground">
            {before}
            <bdi dir="ltr" className="font-semibold">
              {site}
            </bdi>
            {after}
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
