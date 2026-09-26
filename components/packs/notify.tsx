"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n";
import { sendLead } from "@/lib/send-lead";

/*
 * A phone number for a trade that is not open yet, or, with askBusiness,
 * for a business that is on no list at all, with a line saying what it is.
 *
 * It goes through a server route because the leads table is closed to
 * browsers, and lands in OUAQT's inbox as well (lib/send-lead.ts). The same
 * form serves the home page's trade list and each trade's own landing page,
 * so the wording lives in one place.
 */
export function Notify({
  dict,
  businessType,
  intro,
  askBusiness = false,
}: {
  dict: Pick<Dictionary, "builderHome">;
  businessType?: string;
  intro?: string;
  askBusiness?: boolean;
}) {
  const home = dict.builderHome;
  const [business, setBusiness] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  const what = askBusiness ? business.trim() : (businessType ?? "");
  const ready = phone.trim().length >= 6 && what.length >= 2;

  async function send() {
    setState("sending");
    try {
      setState((await sendLead({ businessType: what, phone })) ? "sent" : "failed");
    } catch {
      setState("failed");
    }
  }

  if (state === "sent") {
    return (
      <p className="mt-6 max-w-xl rounded-2xl border border-border bg-surface p-6 text-base leading-relaxed text-foreground">
        {askBusiness ? home.tradesOtherThanks : home.tradesThanks}
      </p>
    );
  }

  const field =
    "mt-1 min-h-[48px] w-full rounded-lg border border-border bg-background px-4 text-base text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-foreground";

  return (
    <div className="mt-6 max-w-xl space-y-4 rounded-2xl border border-border bg-surface p-6">
      <p className="text-base leading-relaxed text-foreground">
        {intro ?? (askBusiness ? home.tradesOtherBody : home.tradesLeaveNumber)}
      </p>
      {askBusiness ? (
        <label className="block">
          <span className="text-base text-muted-foreground">{home.tradesBusiness}</span>
          <input
            type="text"
            value={business}
            onChange={(event) => setBusiness(event.target.value)}
            placeholder={home.tradesBusinessPlaceholder}
            maxLength={120}
            className={field}
          />
        </label>
      ) : null}
      <label className="block">
        <span className="text-base text-muted-foreground">{home.tradesPhone}</span>
        <input
          type="text"
          dir="ltr"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className={field}
        />
      </label>

      {state === "failed" ? (
        <p className="text-base leading-relaxed text-destructive">{home.tradesError}</p>
      ) : null}

      <Button
        type="button"
        variant="accent"
        className="min-h-[48px] text-base"
        disabled={!ready || state === "sending"}
        onClick={() => void send()}
      >
        {askBusiness ? home.tradesSendOther : home.tradesSend}
      </Button>
    </div>
  );
}
