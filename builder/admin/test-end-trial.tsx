"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { AdminCopy } from "./copy";

/*
 * Ending a shop's trial now, on the test version, to see the end-of-trial
 * window, its QR code and the payment that opens the software again. The
 * page shows it only on a test deployment, and the route refuses it anywhere
 * else.
 */
export function TestEndTrial({
  t,
  businesses,
}: {
  t: AdminCopy["trials"];
  businesses: { id: string; name: string }[];
}) {
  const [businessId, setBusinessId] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "not_trial" | "failed">("idle");

  async function end() {
    setState("sending");
    try {
      const response = await fetch("/api/admin/test-end-trial", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
      const answer = await response.json().catch(() => null);
      setState(response.ok ? "done" : answer?.error === "not_trial" ? "not_trial" : "failed");
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
          onChange={(event) => {
            setBusinessId(event.target.value);
            setState("idle");
          }}
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

      <Button
        type="button"
        variant="accent"
        className="min-h-[44px] text-base"
        disabled={!businessId || state === "sending"}
        onClick={() => void end()}
      >
        {t.testEndButton}
      </Button>

      {state === "done" ? <p className="text-base text-foreground">{t.testEndDone}</p> : null}
      {state === "not_trial" ? <p className="text-base text-foreground">{t.testEndNotTrial}</p> : null}
      {state === "failed" ? <p className="text-base text-destructive">{t.grantFailed}</p> : null}
    </div>
  );
}
