"use client";

import type { Pack } from "@/app-ui/packs";

/*
 * Counting steps, and nothing else.
 *
 * A random number, made by the browser, kept for this build only. It is not
 * derived from his phone, his name or his shop, and it is not readable back
 * into any of them. It exists so we can see that nine owners in ten stop at
 * the same question, which is the only way that question ever gets fixed.
 */

const KEY = "ouaqt.builder.session";

function session(): string {
  try {
    const existing = window.sessionStorage.getItem(KEY);
    if (existing) return existing;
    const made = crypto.randomUUID();
    window.sessionStorage.setItem(KEY, made);
    return made;
  } catch {
    return crypto.randomUUID();
  }
}

export function record(event: "reached" | "left" | "finished", step: number, pack?: Pack) {
  const body = JSON.stringify({
    session: session(),
    pack,
    step,
    event,
    deviceClass: window.matchMedia("(min-width: 900px)").matches ? "desktop" : "phone",
  });

  /*
   * sendBeacon so a page being closed still reports it, and a plain fetch
   * where it is missing. Either way nothing waits on it and nothing shows
   * when it fails: an owner is not kept from his software by our counting.
   */
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/builder/event", new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch("/api/builder/event", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // Counting is never worth an error in front of an owner.
  }
}
