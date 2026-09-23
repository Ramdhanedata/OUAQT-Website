"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fill } from "@/lib/utils";
import type { AdminCopy } from "./copy";

/*
 * The two things staff do for a code de configuration: say a code asked for
 * again was sent by hand, and make an expired code work again.
 */

type Words = AdminCopy["requests"];

async function act(payload: Record<string, string>): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/configuration-code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function CodeRequestActions({
  t,
  requestId,
  code,
  expired,
  days,
}: {
  t: Words;
  requestId: string;
  code: string;
  expired: boolean;
  days: number;
}) {
  const [sent, setSent] = useState<"idle" | "busy" | "done" | "failed">("idle");
  const [revived, setRevived] = useState<"idle" | "busy" | "done" | "failed">(expired ? "idle" : "done");

  return (
    <span className="flex flex-wrap items-center gap-3">
      {expired && revived !== "done" ? (
        <Button
          type="button"
          variant="outline"
          className="min-h-[44px] text-base"
          disabled={revived === "busy"}
          onClick={() => {
            setRevived("busy");
            void act({ action: "revive", code }).then((ok) => setRevived(ok ? "done" : "failed"));
          }}
        >
          {t.revive}
        </Button>
      ) : null}
      {expired && revived === "done" ? <span className="text-base text-muted-foreground">{fill(t.revived, { days })}</span> : null}
      {sent === "done" ? (
        <span className="text-base text-muted-foreground">{t.markedSent}</span>
      ) : (
        <Button
          type="button"
          variant="accent"
          className="min-h-[44px] text-base"
          disabled={sent === "busy"}
          onClick={() => {
            setSent("busy");
            void act({ action: "sent", requestId }).then((ok) => setSent(ok ? "done" : "failed"));
          }}
        >
          {t.markSent}
        </Button>
      )}
      {sent === "failed" || revived === "failed" ? <span className="text-base text-destructive">{t.actionFailed}</span> : null}
    </span>
  );
}

/* An owner wrote in with an expired code: typed or pasted here, it works again. */
export function ReviveCode({ t, days }: { t: Words; days: number }) {
  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "failed">("idle");

  return (
    <div className="mt-4 max-w-xl space-y-3 rounded-lg border border-border p-4">
      <label className="block">
        <span className="text-base text-muted-foreground">{t.reviveLabel}</span>
        <input
          type="text"
          dir="ltr"
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            setState("idle");
          }}
          placeholder="OUAQT-XXXX-XXXX"
          className="mt-1 min-h-[44px] w-full rounded-lg border border-border bg-background px-3 text-base text-foreground"
        />
      </label>
      <Button
        type="button"
        variant="outline"
        className="min-h-[44px] text-base"
        disabled={!code.trim() || state === "busy"}
        onClick={() => {
          setState("busy");
          void act({ action: "revive", code }).then((ok) => setState(ok ? "done" : "failed"));
        }}
      >
        {t.revive}
      </Button>
      {state === "done" ? <p className="text-base text-foreground">{fill(t.revived, { days })}</p> : null}
      {state === "failed" ? <p className="text-base text-destructive">{t.reviveFailed}</p> : null}
    </div>
  );
}
