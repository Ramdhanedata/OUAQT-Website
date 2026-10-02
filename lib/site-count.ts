"use client";

import type { Pack } from "@/app-ui/packs";

/*
 * Counting visits and downloads, and nothing else.
 *
 * A random number, made by this browser tab and forgotten when it closes,
 * so that one visitor reading five pages counts once. It is not derived from
 * anything about him and cannot be read back into anything. What is sent is
 * the page's path, its language, phone or computer, and for a download the
 * system and the trade. See app/api/site/event.
 */

const KEY = "ouaqt.site.session";

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

function send(fields: Record<string, string | undefined>) {
  const body = JSON.stringify({
    session: session(),
    deviceClass: window.matchMedia("(min-width: 900px)").matches ? "desktop" : "phone",
    ...fields,
  });
  /* sendBeacon so a page being left still reports; nothing waits on it, nothing shows if it fails. */
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/site/event", new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch("/api/site/event", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true });
  } catch {
    // Counting is never worth an error in front of a visitor.
  }
}

/* A page shown: its path without the language, so /fr/terms and /ar/terms are one page. */
export function countVisit(pathname: string, locale: string) {
  const page = pathname.replace(/^\/(fr|ar|en)(?=\/|$)/, "") || "/";
  send({ kind: "visit", page: page.slice(0, 200), locale });
}

export function countDownload(platform: "windows" | "mac", pack?: Pack) {
  send({ kind: "download", platform, pack });
}
