"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { AdminCopy } from "./copy";

/*
 * Give a trial to a shop the rules refused.
 *
 * The reason is not optional. Whoever reads this list next year needs to know
 * whether we were being kind or being had.
 */
export function TrialOverride({
  t,
  businesses,
}: {
  t: AdminCopy["trials"];
  businesses: { id: string; name: string }[];
}) {
  const [businessId, setBusinessId] = useState("");
  const [reason, setReason] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "failed">("idle");

  async function grant() {
    setState("sending");
    try {
      const response = await fetch("/api/admin/trial", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessId, reason }),
      });
      setState(response.ok ? "done" : "failed");
      if (response.ok) setReason("");
    } catch {
      setState("failed");
    }
  }

  return (
    <div className="mt-6 max-w-xl space-y-3 rounded-lg border border-border p-4">
      <label className="block">
        <span className="text-base text-muted-foreground">{t.shop}</span>
        <select
          value={businessId}
          onChange={(event) => setBusinessId(event.target.value)}
          className="mt-1 min-h-[44px] w-full rounded-lg border border-border bg-background px-3 text-base text-foreground"
        >
          <option value="">{t.choose}</option>
          {businesses.map((one) => (
            <option key={one.id} value={one.id}>
              {one.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-base text-muted-foreground">{t.why}</span>
        <input
          type="text"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={t.whyExample}
          className="mt-1 min-h-[44px] w-full rounded-lg border border-border bg-background px-3 text-base text-foreground"
        />
      </label>

      <Button
        type="button"
        variant="accent"
        className="min-h-[44px] text-base"
        disabled={!businessId || reason.trim().length < 4 || state === "sending"}
        onClick={() => void grant()}
      >
        {t.grant}
      </Button>

      {state === "done" ? (
        <p className="text-base text-foreground">
          {t.granted}
        </p>
      ) : null}
      {state === "failed" ? (
        <p className="text-base text-destructive">{t.grantFailed}</p>
      ) : null}
    </div>
  );
}
