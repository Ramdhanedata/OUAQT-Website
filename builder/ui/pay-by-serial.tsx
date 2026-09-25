"use client";

import { useEffect, useRef, useState } from "react";
import type { BuilderCopy } from "@/builder/copy";
import { formatAsTyped } from "@/builder/config-code/code";
import type { PayTo } from "@/builder/payment/apps";
import type { ReadBack } from "@/builder/payment/checks";
import type { Price } from "@/builder/payment/pricing";
import type { Locale } from "@/lib/i18n/config";
import { fill } from "@/lib/utils";
import { Field } from "./fields";
import { licenceLine, owes, type LicenceShown } from "./licence-line";
import { Pay, PaymentReceived } from "./pay";

/*
 * Paying with the numéro de série: the number, then his shop and where its
 * licence stands, then the same payment steps as the account page. No
 * account, no password, no email: an owner who built his software from the
 * phone has none of those and needs none.
 */

type Lookup = {
  serial: string;
  pack: string | null;
  nameLatin: string;
  nameArabic: string;
  licence: LicenceShown | null;
  pending: boolean;
  price: Price | null;
  payTo: PayTo[];
};

const COMPLETE = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export function PayBySerial({ copy, lang }: { copy: BuilderCopy; lang: Locale }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<"unknown" | "expired" | "failed" | null>(null);
  const [wait, setWait] = useState(0);
  const [found, setFound] = useState<Lookup | null>(null);
  const [sent, setSent] = useState<{ read: ReadBack | null; confirmed: boolean } | null>(null);
  const tried = useRef("");

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait(wait - 1), 1000); // not-a-rule: a countdown by the second
    return () => clearTimeout(timer);
  }, [wait]);

  /*
   * Opened from the software itself, whose end-of-trial window adds the
   * serial after the # so the owner has nothing to type. The part after the
   * # never reaches a server, and it is taken off the address at once.
   */
  useEffect(() => {
    const given = formatAsTyped(decodeURIComponent(window.location.hash.slice(1)));
    if (!COMPLETE.test(given)) return;
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    setValue(given);
    tried.current = given;
    void look(given);
    // Once, when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function look(entry: string) {
    if (!entry.trim() || busy || wait > 0) return;
    setBusy(true);
    setProblem(null);
    try {
      const response = await fetch("/api/builder/payment/lookup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ number: entry }),
      });
      const body = (await response.json().catch(() => null)) as (Lookup & { error?: string; wait?: number }) | null;
      if (response.ok && body?.serial) return setFound(body);
      if (response.status === 429) setWait(body?.wait ?? 5);
      else if (response.status === 410) setProblem("expired");
      else if (response.status === 404) {
        setProblem("unknown");
        if (body?.wait) setWait(body.wait);
      } else setProblem("failed");
    } catch {
      setProblem("failed");
    } finally {
      setBusy(false);
    }
  }

  if (found) {
    const name = (lang === "ar" && found.nameArabic) || found.nameLatin;
    const trade = found.pack ? (copy.packs as Record<string, string>)[found.pack] ?? found.pack : "";
    return (
      <div className="space-y-6">
        <div>
          <p className="text-base font-medium text-foreground">
            {[name, trade].filter(Boolean).join(" · ")} <bdi dir="ltr" className="text-muted-foreground">{found.serial}</bdi>
          </p>
          <p className="mt-2 text-base leading-relaxed text-foreground">{licenceLine(copy, lang, found.licence)}</p>
        </div>
        {sent || found.pending ? (
          <PaymentReceived copy={copy} language={lang} read={sent?.read ?? null} confirmed={sent?.confirmed ?? false} />
        ) : owes(found.licence) && found.price ? (
          <Pay
            copy={copy}
            language={lang}
            price={found.price}
            payTo={found.payTo}
            onSent={(read, confirmed) => setSent({ read, confirmed })}
            serial={found.serial}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Field label={copy.code.label}>
        <input
          type="text"
          dir="ltr"
          value={value}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="characters"
          placeholder={copy.code.placeholder}
          disabled={wait > 0}
          onChange={(event) => {
            const next = formatAsTyped(event.target.value);
            setValue(next);
            /* A whole number is looked up by itself, once per entry. */
            if (COMPLETE.test(next) && next !== tried.current) {
              tried.current = next;
              void look(next);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") void look(value);
          }}
          className="min-h-[48px] w-full rounded-lg border border-border bg-background px-4 text-lg tracking-wider text-foreground outline-none focus:border-foreground disabled:opacity-50"
        />
      </Field>
      {busy ? <p className="text-base text-muted-foreground" role="status">{copy.code.opening}</p> : null}
      {wait > 0 ? <p className="text-base text-muted-foreground" role="status">{fill(copy.code.wait, { seconds: wait })}</p> : null}
      {problem ? (
        <p className="text-base text-foreground" role="alert">
          {problem === "unknown" ? copy.code.unknown : problem === "expired" ? copy.code.expired : copy.code.failed}
        </p>
      ) : null}
    </div>
  );
}
