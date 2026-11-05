"use client";

import { useEffect, useRef, useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { defaultConfiguration } from "@/app-ui/config";
import type { Pack } from "@/app-ui/packs";
import { APP_HEIGHT, APP_WIDTH, CANVAS_HEIGHT, Fit, TITLE_HEIGHT } from "@/builder/ui/preview/fit";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { packIcons } from "@/components/packs/pack-icons";
import { Laptop, Phone, PHONE_BEZEL_SHARE } from "./devices";

/*
 * The software itself on the home page, for a visitor to try before
 * building anything: the same build the Builder's preview runs, with a
 * trade's default setup and its sample data.
 *
 * It loads only once it is well on screen. The app's sale screen puts the
 * cursor in its search box, and a page that is still further up would jump
 * down to it; once the window is in view there is nothing to jump to. It
 * also keeps the app's weight off the first paint of the page.
 *
 * Two versions, the same build: the computer's window, scaled to the column,
 * and a phone at a phone's real width, where the app lays itself out for one.
 */

const APP_SOURCE = "/app-preview/index.html";

/*
 * The phone's own width and height, so the app lays itself out as it does on
 * one. The frame's edge is a share of its width (see devices.tsx), so the
 * frame is drawn a little wider for the screen inside to be the phone's.
 */
const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 844;
const PHONE_FRAME_WIDTH = Math.ceil(PHONE_WIDTH / (1 - 2 * PHONE_BEZEL_SHARE));

type View = "computer" | "phone";

/* One running copy of the app: told its trade, and covered until it has drawn itself. */
function AppFrame({
  pack,
  lang,
  shops,
  loading,
  loadingClass,
}: {
  pack: Pack;
  lang: Locale;
  shops: Record<Pack, string>;
  loading: string;
  loadingClass: string;
}) {
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);

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
    <>
      <iframe ref={frame} src={APP_SOURCE} title={shops[pack]} style={{ width: "100%", height: "100%", border: 0, display: "block" }} />
      {started ? null : (
        <div className="absolute inset-0 flex items-center justify-center bg-app-background">
          <p className={cn("animate-pulse text-app-ink3", loadingClass)}>{loading}</p>
        </div>
      )}
    </>
  );
}

export function LiveDemo({
  lang,
  packs,
  labels,
  shops,
  loading,
  note,
  phone,
  onComputer,
  onPhone,
}: {
  lang: Locale;
  packs: Pack[];
  labels: Record<Pack, string>;
  shops: Record<Pack, string>;
  loading: string;
  note: string;
  phone: string;
  onComputer: string;
  onPhone: string;
}) {
  const [pack, setPack] = useState<Pack>(packs.includes("restaurant") ? "restaurant" : packs[0] ?? "restaurant");
  const [load, setLoad] = useState(false);
  const [view, setView] = useState<View>("computer");
  /* Each version starts the first time it is looked at, and keeps what was done in it after that. */
  const [seen, setSeen] = useState<Record<View, boolean>>({ computer: false, phone: false });
  const box = useRef<HTMLDivElement>(null);

  /* Someone already on a phone starts on the version made for it. */
  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) setView("phone");
  }, []);

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
    if (load) setSeen((before) => (before[view] ? before : { ...before, [view]: true }));
  }, [load, view]);

  const views: { value: View; label: string; Icon: typeof Monitor }[] = [
    { value: "computer", label: onComputer, Icon: Monitor },
    { value: "phone", label: onPhone, Icon: Smartphone },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
      <div className="inline-flex rounded-full border border-border bg-surface p-1 shadow-card">
        {views.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={view === value}
            onClick={() => setView(value)}
            className={cn(
              "inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors",
              view === value ? "bg-foreground text-background" : "text-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
      </div>

      <div role="tablist" className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0">
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

      <div ref={box} className="pt-4">
        <div className={view === "computer" ? "mx-auto max-w-5xl px-[4%] sm:px-[5%]" : "hidden"}>
          <Laptop>
          <Fit mode="width">
            <div
              className="overflow-hidden bg-app-background"
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
                {seen.computer ? (
                  <AppFrame pack={pack} lang={lang} shops={shops} loading={loading} loadingClass="text-[22px]" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-app-background">
                    <p className="animate-pulse text-[22px] text-app-ink3">{loading}</p>
                  </div>
                )}
              </div>
            </div>
          </Fit>
          </Laptop>
        </div>

        <div className={view === "phone" ? undefined : "hidden"}>
          {/* The frame's strips above and below the screen keep its round corners off the app. */}
          <Phone className="mx-auto max-w-full" style={{ width: PHONE_FRAME_WIDTH }}>
            <div className="relative" style={{ height: `min(76vh, ${PHONE_HEIGHT}px)` }}>
              {seen.phone ? (
                <AppFrame pack={pack} lang={lang} shops={shops} loading={loading} loadingClass="text-base" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-app-background">
                  <p className="animate-pulse text-base text-app-ink3">{loading}</p>
                </div>
              )}
            </div>
          </Phone>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">{note}</p>
      {view === "computer" ? <p className="text-center text-sm text-muted-foreground sm:hidden">{phone}</p> : null}
    </div>
  );
}
