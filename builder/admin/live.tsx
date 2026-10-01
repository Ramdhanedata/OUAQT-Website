"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { fill } from "@/lib/utils";

/*
 * Keeps an admin page current without anybody pressing anything.
 *
 * The page is drawn on the server, so staying live is asking the server to
 * draw it again: router.refresh() keeps whatever is typed in a form on the
 * page and swaps only what changed. It waits while the tab is hidden, since
 * nobody is reading it, and catches up the moment it is shown again.
 */

const EVERY_MS = 15_000; // not-a-rule: how often a page open in front of staff re-reads

export function LiveRefresh({
  drawnAt,
  words,
  locale,
}: {
  drawnAt: string;
  words: { live: string; refresh: string };
  locale: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [now, setNow] = useState(drawnAt);

  useEffect(() => setNow(drawnAt), [drawnAt]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") startTransition(() => router.refresh());
    };
    const timer = window.setInterval(refresh, EVERY_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router]);

  const time = new Date(now).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-surface px-3 text-sm text-muted-foreground">
        <span aria-hidden className="relative flex h-2 w-2">
          <span className={`absolute inline-flex h-full w-full rounded-full bg-app-success opacity-60 ${pending ? "" : "animate-ping"}`} />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-app-success" />
        </span>
        <span className="tabular-nums">{fill(words.live, { time })}</span>
      </span>
      <button
        type="button"
        onClick={() => startTransition(() => router.refresh())}
        aria-label={words.refresh}
        title={words.refresh}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-surface px-3 text-sm text-foreground hover:border-foreground"
      >
        <RefreshCw aria-hidden className={`h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`} />
        <span className="hidden sm:inline">{words.refresh}</span>
      </button>
    </span>
  );
}
