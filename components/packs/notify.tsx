"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n";
import { sendLead } from "@/lib/send-lead";

/*
 * A phone number for a trade that is not open yet, and nothing else.
 *
 * It goes through a server route because the leads table is closed to
 * browsers, and lands in OUAQT's inbox as well (lib/send-lead.ts). The same form serves the home page's trade list and each trade's
 * own landing page, so the wording lives in one place.
 */
export function Notify({
  dict,
  businessType,
  intro,
}: {
  dict: Dictionary;
  businessType: string;
  intro?: string;
}) {
  const home = dict.builderHome;
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  async function send() {
    setState("sending");
    try {
      setState((await sendLead({ businessType, phone })) ? "sent" : "failed");
    } catch {
      setState("failed");
    }
  }

  if (state === "sent") {
    return (
      <p className="mt-6 text-base leading-relaxed text-foreground">
        {home.tradesThanks}
      </p>
    );
  }

  return (
    <div className="mt-6 max-w-md space-y-3 rounded-2xl border border-border p-6">
      <p className="text-base leading-relaxed text-foreground">
        {intro ?? home.tradesLeaveNumber}
      </p>
      <label className="block">
        <span className="text-base text-muted-foreground">{home.tradesPhone}</span>
        <input
          type="text"
          dir="ltr"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="mt-1 min-h-[48px] w-full rounded-lg border border-border bg-background px-4 text-base text-foreground outline-none focus:border-foreground"
        />
      </label>

      {state === "failed" ? (
        <p className="text-base leading-relaxed text-destructive">{home.tradesError}</p>
      ) : null}

      <Button
        type="button"
        variant="accent"
        className="min-h-[48px] text-base"
        disabled={phone.trim().length < 6 || state === "sending"}
        onClick={() => void send()}
      >
        {home.tradesSend}
      </Button>
    </div>
  );
}
