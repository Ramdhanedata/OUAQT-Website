"use client";

import { useEffect, useRef, useState } from "react";
import { defaultConfiguration } from "@/app-ui/config";
import type { Pack } from "@/app-ui/packs";
import { APP_HEIGHT, APP_WIDTH, CANVAS_HEIGHT, Fit, TITLE_HEIGHT } from "@/builder/ui/preview/fit";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { packIcons } from "./pack-icons";

/*
 * The software itself on the home page, for a visitor to try before
 * building anything: the same build the Builder's preview runs, with a
 * trade's default setup and its sample data.
 *
 * It loads only once it is well on screen. The app's sale screen puts the
 * cursor in its search box, and a page that is still further up would jump
 * down to it; once the window is in view there is nothing to jump to. It
 * also keeps the app's weight off the first paint of the page.
 */

const APP_SOURCE = "/app-preview/index.html";

export function LiveDemo({
  lang,
  packs,
  labels,
  shops,
  loading,
  note,
  phone,
}: {
  lang: Locale;
  packs: Pack[];
  labels: Record<Pack, string>;
  shops: Record<Pack, string>;
  loading: string;
  note: string;
  phone: string;
}) {
  const [pack, setPack] = useState<Pack>(packs.includes("restaurant") ? "restaurant" : packs[0] ?? "restaurant");
  const [load, setLoad] = useState(false);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const element = box.current;
    if (!element || load) return;
    if (typeof IntersectionObserver === "undefined") {
      setLoad(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.intersectionRatio >= 0.35)) {
          setLoad(true);
          observer.disconnect();
        }
      },
      { threshold: [0, 0.35] }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [load]);

  useEffect(() => {
    const heard = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return;
      const type = (event.data as { type?: string })?.type;
      if (type === "ouaqt:ready") setReady(true);
      if (type === "ouaqt:started") setStarted(true);
    };
    window.addEventListener("message", heard);
    return () => window.removeEventListener("message", heard);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const base = defaultConfiguration(pack, lang);
    const configuration = {
      ...base,
      business: { ...base.business, nameLatin: shops[pack], nameArabic: lang === "ar" ? shops[pack] : undefined },
    };
    frame.current?.contentWindow?.postMessage({ type: "ouaqt:configuration", configuration }, window.location.origin);
  }, [ready, pack, lang, shops]);

  return (
    <div className="space-y-5">
      <div role="tablist" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {packs.map((one) => {
          const Icon = packIcons[one];
          const chosen = one === pack;
          return (
            <button
              key={one}
              type="button"
              role="tab"
              aria-selected={chosen}
              onClick={() => setPack(one)}
              className={cn(
                "inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
                chosen
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-surface text-foreground hover:border-foreground/40"
              )}
            >
              <Icon className="h-4 w-4" />
              {labels[one]}
            </button>
          );
        })}
      </div>

      <div ref={box}>
        <Fit mode="width">
          <div
            className="overflow-hidden rounded-[18px] border-2 border-app-strong bg-app-background shadow-[0_40px_80px_-30px_rgba(10,10,10,0.4)]"
            style={{ width: APP_WIDTH, height: CANVAS_HEIGHT }}
          >
            <div className="relative flex items-center border-b border-app-line bg-app-hover px-4" style={{ height: TITLE_HEIGHT }}>
              <span className="flex gap-2" aria-hidden>
                <span className="h-3.5 w-3.5 rounded-full bg-app-strong" />
                <span className="h-3.5 w-3.5 rounded-full bg-app-strong" />
                <span className="h-3.5 w-3.5 rounded-full bg-app-strong" />
              </span>
              <span className="absolute inset-x-24 truncate text-center text-[15px] text-app-ink2">{shops[pack]}</span>
            </div>
            <div className="relative" style={{ width: APP_WIDTH, height: APP_HEIGHT }}>
              {load ? (
                <iframe
                  ref={frame}
                  src={APP_SOURCE}
                  title={shops[pack]}
                  style={{ width: APP_WIDTH, height: APP_HEIGHT, border: 0, display: "block" }}
                />
              ) : null}
              {started ? null : (
                <div className="absolute inset-0 flex items-center justify-center bg-app-background">
                  <p className="animate-pulse text-[22px] text-app-ink3">{loading}</p>
                </div>
              )}
            </div>
          </div>
        </Fit>
      </div>

      <p className="text-sm text-muted-foreground">{note}</p>
      <p className="text-sm text-muted-foreground sm:hidden">{phone}</p>
    </div>
  );
}
