"use client";

import { useState } from "react";
import type { BuilderCopy } from "@/builder/copy";
import { browserClient } from "@/builder/db/client";
import { Button } from "./owner-button";
import { Container } from "@/components/ui/container";
import type { Locale } from "@/lib/i18n/config";
import { localisedHref } from "@/lib/i18n/routes";
import { CodeEntry, forgetOpened } from "./config-code";
import type { LicenceStatus } from "@/builder/licence/status";
import type { PayTo } from "@/builder/payment/apps";
import type { ReadBack } from "@/builder/payment/checks";
import type { Price } from "@/builder/payment/pricing";
import { fill } from "@/lib/utils";
import { Field, TextInput } from "./fields";
import { licenceLine, owes } from "./licence-line";
import { Pay, PaymentReceived } from "./pay";
import { InstallHelp } from "./install-help";
import { isPhone, loginFor } from "./step-account";

/*
 * Where an owner comes back to.
 *
 * Phone first, one column, in the order he cares about: his software and his
 * serial, then what he pays, then his computers, then what he has asked us
 * for. The parts that are not built yet say so in a sentence, rather than
 * showing an empty box he will wonder about.
 */

export type AccountState =
  | { kind: "signed_out" }
  | { kind: "no_business" }
  | {
      kind: "signed_in";
      businessName: string;
      pack: string;
      serial: string | null;
      requests: { text: string; status: string }[];
      installers: { windows: string | null; mac: string | null };
      licence: {
        status: LicenceStatus;
        endsAt: string | null;
        daysLeft: number | null;
        graceDaysLeft: number | null;
      } | null;
      lastPaymentStatus: string | null;
      devices: {
        deviceId: string;
        name: string | null;
        role: "main" | "secondary";
        lastSeen: string;
      }[];
      /* A year, and six months: the lengths he may pay for, with their prices. */
      prices: Price[];
      payTo: PayTo[];
    };

export function AccountArea({
  copy,
  lang,
  state,
}: {
  copy: BuilderCopy;
  lang: Locale;
  state: AccountState;
}) {
  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {copy.myAccount.title}
        </h1>

        <div className="mt-10">
          {state.kind === "signed_out" ? (
            <>
              <SignIn copy={copy} />
              {/*
                * The owner who configured on his phone and never made an
                * account comes here looking for his download, or to pay. His
                * numéro de série is what leads to both.
                */}
              <div className="mt-10 space-y-2 border-t border-border pt-6">
                <CodeEntry
                  copy={copy}
                  locale={lang}
                  supportWhatsapp={null}
                  onRestart={() => {
                    forgetOpened();
                    window.location.href = localisedHref(lang, "builder");
                  }}
                />
                <div>
                  <a
                    href={localisedHref(lang, "pay")}
                    className="inline-flex min-h-[48px] items-center text-base text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
                  >
                    {copy.payBySerial.link}
                  </a>
                </div>
              </div>
            </>
          ) : state.kind === "no_business" ? (
            <div className="space-y-6">
              <p className="text-base leading-relaxed text-muted-foreground">
                {copy.myAccount.noBusiness}
              </p>
              <a
                href={localisedHref(lang, "builder")}
                className="inline-flex min-h-[48px] items-center rounded-lg bg-accent px-5 text-base font-medium text-accent-foreground"
              >
                {copy.myAccount.start}
              </a>
            </div>
          ) : (
            <SignedIn copy={copy} lang={lang} state={state} />
          )}
        </div>
      </Container>
    </section>
  );
}

function SignIn({ copy }: { copy: BuilderCopy }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function open() {
    if (!isPhone(phone) || password === "") return setError(true);
    setBusy(true);
    setError(false);

    const supabase = await browserClient();
    if (!supabase) {
      setBusy(false);
      return setError(true);
    }

    const { error: failed } = await supabase.auth.signInWithPassword({
      email: loginFor(phone),
      password,
    });

    if (failed) {
      setBusy(false);
      return setError(true);
    }
    // The page reads the session on the server, so it has to be asked again.
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">
        {copy.myAccount.signInHeading}
      </h2>

      <Field label={copy.account.phone}>
        <TextInput dir="ltr" inputMode="tel" autoComplete="tel" value={phone} onChange={setPhone} />
      </Field>

      <Field label={copy.account.password}>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="min-h-[48px] w-full rounded-lg border border-border bg-background px-4 text-base text-foreground outline-none focus:border-foreground"
        />
      </Field>

      {error ? (
        <p className="text-base text-destructive">{copy.myAccount.signInError}</p>
      ) : null}

      <Button type="button" variant="accent" onClick={() => void open()} disabled={busy}>
        {copy.myAccount.signIn}
      </Button>
    </div>
  );
}

function SignedIn({
  copy,
  lang,
  state,
}: {
  copy: BuilderCopy;
  lang: Locale;
  state: Extract<AccountState, { kind: "signed_in" }>;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          {copy.myAccount.mySoftware}
        </h2>
        <p className="text-base text-foreground">{state.businessName}</p>

        {state.serial ? (
          <div className="space-y-3">
            <p
              dir="ltr"
              className="rounded-xl border border-border bg-muted/40 py-5 text-center font-mono text-2xl font-semibold tracking-[0.2em] text-foreground"
            >
              {state.serial}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void navigator.clipboard?.writeText(state.serial ?? "");
                setCopied(true);
              }}
            >
              {copied ? copy.serial.copied : copy.serial.copy}
            </Button>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {state.installers.windows ? (
            <a
              href={state.installers.windows}
              className="inline-flex min-h-[48px] items-center rounded-lg border border-border px-5 text-base text-foreground"
            >
              {copy.serial.windows}
            </a>
          ) : null}
          {state.installers.mac ? (
            <a
              href={state.installers.mac}
              className="inline-flex min-h-[48px] items-center rounded-lg border border-border px-5 text-base text-foreground"
            >
              {copy.serial.mac}
            </a>
          ) : null}
          <a
            href={localisedHref(lang, "builder")}
            className="inline-flex min-h-[48px] items-center rounded-lg border border-border px-5 text-base text-foreground"
          >
            {copy.myAccount.edit}
          </a>
        </div>
        {state.installers.windows || state.installers.mac ? <InstallHelp copy={copy} first="windows" /> : null}
      </section>

      <Subscription copy={copy} lang={lang} state={state} />
      <MyDevices copy={copy} lang={lang} devices={state.devices} />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          {copy.myAccount.myRequests}
        </h2>
        {state.requests.length === 0 ? (
          <p className="text-base text-muted-foreground">
            {copy.myAccount.noRequests}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {state.requests.map((request, index) => (
              <li key={index} className="py-3 text-base leading-relaxed text-foreground">
                {request.text}
              </li>
            ))}
          </ul>
        )}
      </section>

      <SignOut copy={copy} />
    </div>
  );
}

function Subscription({
  copy,
  lang,
  state,
}: {
  copy: BuilderCopy;
  lang: Locale;
  state: Extract<AccountState, { kind: "signed_in" }>;
}) {
  /* Sent from this page just now, with what was read off the screenshot. */
  const [sent, setSent] = useState<{ read: ReadBack | null; confirmed: boolean } | null>(null);
  const licence = state.licence;

  const where = () => licenceLine(copy, lang, licence);

  const waiting =
    sent || state.lastPaymentStatus === "pending_confirmation";
  const due = owes(licence);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">
        {copy.myAccount.mySubscription}
      </h2>
      <p className="text-base leading-relaxed text-foreground">{where()}</p>

      {waiting ? (
        <PaymentReceived copy={copy} language={lang} read={sent?.read ?? null} confirmed={sent?.confirmed ?? false} />
      ) : due && state.prices.length > 0 ? (
        <Pay
          copy={copy}
          language={lang}
          prices={state.prices}
          payTo={state.payTo}
          onSent={(read, confirmed) => setSent({ read, confirmed })}
        />
      ) : null}
    </section>
  );
}

function MyDevices({
  copy,
  lang,
  devices,
}: {
  copy: BuilderCopy;
  lang: Locale;
  devices: Extract<AccountState, { kind: "signed_in" }>["devices"];
}) {
  const [asking, setAsking] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function release(deviceId: string) {
    setBusy(true);
    const response = await fetch("/api/builder/device", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deviceId }),
    });
    const body = await response.json().catch(() => null);
    setBusy(false);
    setAsking(null);

    setDone((all) => ({
      ...all,
      [deviceId]: response.ok
        ? (copy.devices.released as string)
        : body?.error === "too_many_releases"
          ? (copy.devices.tooMany as string)
          : (copy.devices.failed as string),
    }));
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">
        {copy.myAccount.myDevices}
      </h2>

      {devices.length === 0 ? (
        <p className="text-base leading-relaxed text-muted-foreground">
          {copy.devices.none}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {devices.map((device) => (
            <li key={device.deviceId} className="space-y-2 py-3">
              <p className="text-base text-foreground">
                {device.name ??
                  (device.role === "main" ? copy.devices.main : copy.devices.secondary)}
                <span className="text-muted-foreground">
                  {" "}
                  ·{" "}
                  {fill(copy.devices.lastSeen as string, {
                    date: new Date(device.lastSeen).toLocaleDateString(lang),
                  })}
                </span>
              </p>

              {done[device.deviceId] ? (
                <p className="text-base leading-relaxed text-muted-foreground">
                  {done[device.deviceId]}
                </p>
              ) : asking === device.deviceId ? (
                /* Rule 9: anything that takes something away asks first. */
                <div className="space-y-2">
                  <p className="text-base leading-relaxed text-foreground">
                    {copy.devices.confirm}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="accent"
                      disabled={busy}
                      onClick={() => void release(device.deviceId)}
                    >
                      {busy ? copy.devices.releasing : copy.devices.release}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setAsking(null)}>
                      {copy.devices.cancel}
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAsking(device.deviceId)}
                  className="min-h-[48px] text-base text-muted-foreground underline decoration-border underline-offset-4"
                >
                  {copy.devices.release}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SignOut({ copy }: { copy: BuilderCopy }) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={async () => {
        const supabase = await browserClient();
        await supabase?.auth.signOut();
        window.location.reload();
      }}
    >
      {copy.myAccount.signOut}
    </Button>
  );
}
