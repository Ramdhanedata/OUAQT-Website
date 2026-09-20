"use client";

import { useState } from "react";
import { browserClient } from "@/builder/db/client";
import { Button } from "@/builder/ui/owner-button";
import { Field, TextInput } from "@/builder/ui/fields";

/*
 * Signing in as staff: a password, then a code from the phone.
 *
 * The second step is not optional and there is no way past it. An admin
 * account behind a password alone is one leaked password away from somebody
 * confirming their own payments.
 */

type Stage = "password" | "code" | "enrol";

export function AdminSignIn({ reason }: { reason: "signed_out" | "needs_second_factor" | "not_staff" }) {
  const [stage, setStage] = useState<Stage>(
    reason === "needs_second_factor" ? "code" : "password"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (reason === "not_staff") {
    return (
      <div className="max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">OUAQT admin</h1>
        <p className="text-base leading-relaxed text-foreground">
          This account is not on the staff list. If you are a shop owner, your
          software is on your own account page.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            const supabase = await browserClient();
            await supabase?.auth.signOut();
            window.location.reload();
          }}
        >
          Sign out
        </Button>
      </div>
    );
  }

  async function withPassword() {
    setBusy(true);
    setError(null);
    const supabase = await browserClient();
    const failed = await supabase?.auth.signInWithPassword({ email, password });
    setBusy(false);

    if (!supabase || failed?.error) return setError("Wrong email or password.");
    await goToSecondFactor();
  }

  /*
   * An account with no factor yet has to make one before it can be used, so
   * the first sign-in shows the enrolment rather than a code box it could
   * never satisfy.
   */
  async function goToSecondFactor() {
    const supabase = await browserClient();
    const { data } = (await supabase?.auth.mfa.listFactors()) ?? { data: null };
    const verified = data?.totp?.find((factor) => factor.status === "verified");

    if (verified) {
      setFactorId(verified.id);
      return setStage("code");
    }

    const enrolled = await supabase?.auth.mfa.enroll({ factorType: "totp" });
    if (enrolled?.error || !enrolled?.data) {
      return setError("Could not start two factor setup.");
    }
    setFactorId(enrolled.data.id);
    setQr(enrolled.data.totp.qr_code);
    /*
     * The code in writing as well as in a square. Setting this up on the same
     * phone that shows the square means there is nothing to point a camera
     * at, and every authenticator app takes a typed key.
     */
    setSecret(enrolled.data.totp.secret);
    setStage("enrol");
  }

  async function withCode() {
    if (!factorId) return setError("No second factor to check against.");
    setBusy(true);
    setError(null);

    const supabase = await browserClient();
    const challenge = await supabase?.auth.mfa.challenge({ factorId });
    if (challenge?.error || !challenge?.data) {
      setBusy(false);
      return setError("Could not ask for a code.");
    }

    const verified = await supabase?.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code: code.trim(),
    });
    setBusy(false);

    if (verified?.error) return setError("That code was not accepted.");
    window.location.reload();
  }

  return (
    <div className="max-w-sm space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">OUAQT admin</h1>

      {stage === "password" ? (
        <>
          <Field label="Email">
            <TextInput dir="ltr" value={email} onChange={setEmail} />
          </Field>
          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-h-[48px] w-full rounded-lg border border-border bg-background px-4 text-base text-foreground outline-none focus:border-foreground"
            />
          </Field>
          <Button type="button" variant="accent" disabled={busy} onClick={() => void withPassword()}>
            Continue
          </Button>
        </>
      ) : null}

      {stage === "enrol" && qr ? (
        <div className="space-y-4">
          <p className="text-base leading-relaxed text-muted-foreground">
            Scan this with an authenticator app, then type the six digit code it
            shows.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="" className="h-48 w-48 bg-white p-2" />
          {secret ? (
            <p className="text-base text-muted-foreground">
              Or type this key:{" "}
              <code data-totp-secret className="text-foreground">{secret}</code>
            </p>
          ) : null}
        </div>
      ) : null}

      {stage === "code" || stage === "enrol" ? (
        <>
          <Field label="Six digit code">
            <TextInput dir="ltr" inputMode="tel" value={code} onChange={setCode} />
          </Field>
          <Button type="button" variant="accent" disabled={busy} onClick={() => void withCode()}>
            Sign in
          </Button>
        </>
      ) : null}

      {error ? <p className="text-base text-destructive">{error}</p> : null}
    </div>
  );
}
