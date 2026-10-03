"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fill } from "@/lib/utils";
import type { PaymentsCopy } from "./copy-payments";

/*
 * Saying the rest of an overpayment was sent back. Asked twice, because it
 * cannot be taken back here: once written, the payment stops showing as
 * owed and the trail keeps who said so.
 */
export function RefundButton({ paymentId, amount, words }: { paymentId: string; amount: string; words: PaymentsCopy["refund"] }) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<"done" | "failed" | null>(null);

  async function save() {
    setBusy(true);
    setState(null);
    const response = await fetch("/api/admin/payment", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ paymentId, action: "refunded" }),
    }).catch(() => null);
    setBusy(false);
    if (!response?.ok) return setState("failed");
    setState("done");
    setAsking(false);
    router.refresh();
  }

  if (state === "done") return <p className="text-base text-foreground" role="status">{words.done}</p>;

  return (
    <div className="space-y-3">
      {asking ? (
        <>
          <p className="text-base text-foreground">{fill(words.confirm, { amount })}</p>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="accent" disabled={busy} onClick={() => void save()}>
              {busy ? words.saving : words.yes}
            </Button>
            <Button type="button" variant="outline" disabled={busy} onClick={() => setAsking(false)}>
              {words.no}
            </Button>
          </div>
        </>
      ) : (
        <Button type="button" variant="accent" onClick={() => setAsking(true)}>
          {fill(words.button, { amount })}
        </Button>
      )}
      {state === "failed" ? (
        <p className="text-base text-destructive" role="alert">
          {words.failed}
        </p>
      ) : null}
    </div>
  );
}
