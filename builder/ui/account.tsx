"use client";

import { useState } from "react";
import type { BuilderCopy } from "@/builder/copy";
import { browserClient } from "@/builder/db/client";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import type { Locale } from "@/lib/i18n/config";
import { localisedHref } from "@/lib/i18n/routes";
import { Field, TextInput } from "./fields";
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
            <SignIn copy={copy} />
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
      </section>

      <Waiting copy={copy} title={copy.myAccount.mySubscription} />
      <Waiting copy={copy} title={copy.myAccount.myDevices} />

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

/* A part that is not built yet, said plainly rather than shown empty. */
function Waiting({ copy, title }: { copy: BuilderCopy; title: string }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="text-base leading-relaxed text-muted-foreground">
        {copy.myAccount.soon}
      </p>
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
