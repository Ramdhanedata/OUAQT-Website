"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Minimize2, Smartphone } from "lucide-react";
import {
  configurationSchema,
  defaultConfiguration,
  type AppLanguage,
  type Configuration,
  type Pack,
} from "@/app-ui";
import { applyAnswers } from "@/builder/packs/bank";
import { interviewFor } from "@/builder/packs";
import type { BuilderCopy } from "@/builder/copy";
import type { DraftAnswers } from "@/builder/draft/store";
import { cn } from "@/lib/utils";
import { APP_HEIGHT, APP_WIDTH, CANVAS_HEIGHT, Fit, TITLE_HEIGHT, type FitMode } from "./fit";
import { changedPaths, focusFor, type Section } from "./model";
import { wordsFor } from "./words";

/*
 * The owner's own software, running, while they are still describing it.
 *
 * The window below is the desktop app itself: its screens, its database
 * code and its rules, built for a web page and served from
 * public/app-preview (the desktop repository's `npm run build:web` puts it
 * there). What the owner tries here is what they download, button for
 * button. This file only frames it: it sends the configuration the answers
 * make, each time they change it, and says which screen the last answer
 * changed so the window can open it.
 *
 * The app is laid out at a laptop's size and never anything else; the frame
 * scales the whole window to the space the page has, so the screens keep
 * the proportions they will have on the day.
 */

export function configurationFrom(answers: DraftAnswers, fallbackLanguage: AppLanguage): Configuration {
  const pack: Pack = answers.pack ?? "pharmacy";
  const start = defaultConfiguration(pack, answers.appLanguage ?? fallbackLanguage);

  /*
   * The interview's answers, then anything the AI worked out from a sentence
   * the owner wrote. The AI's part comes last because the server has already
   * validated it against the schema, so it is the more considered of the two.
   */
  const answered = applyAnswers(start, interviewFor(pack), answers.interview ?? {});
  const patched = answers.patched
    ? {
        ...answered,
        common: (answers.patched.common ?? answered.common) as typeof answered.common,
        features: (answers.patched.features ?? answered.features) as typeof answered.features,
      }
    : answered;

  const base = configurationSchema.safeParse({
    ...patched,
    business: { ...patched.business, nameLatin: "x" },
  }).success
    ? patched
    : answered;

  return {
    ...base,
    language: {
      builder: answers.builderLanguage ?? fallbackLanguage,
      app: answers.appLanguage ?? answers.builderLanguage ?? fallbackLanguage,
    },
    business: {
      nameLatin: answers.nameLatin?.trim() || "",
      nameArabic: answers.nameArabic?.trim() || undefined,
      phone: answers.phone?.trim() || undefined,
      address: answers.address?.trim() || undefined,
      logo: answers.logo,
      logoMono: answers.logoMono,
    },
  };
}

const APP_SOURCE = "/app-preview/index.html";
const UPDATED_MS = 4500; // not-a-rule: how long the line under the window names the screen an answer changed

export function Preview({
  copy,
  answers,
  fallbackLanguage,
  fill = false,
  onExpand,
}: {
  copy: BuilderCopy;
  answers: DraftAnswers;
  fallbackLanguage: AppLanguage;
  /** Fill the height it is given, as the full-screen view on a phone does, rather than follow the width. */
  fill?: boolean;
  /** Told when the window is enlarged over the page, so a sticky column around it can lift itself. */
  onExpand?: (expanded: boolean) => void;
}) {
  const configuration = useMemo(() => configurationFrom(answers, fallbackLanguage), [answers, fallbackLanguage]);
  const words = wordsFor(configuration.language.app);
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [actual, setActual] = useState(false);
  const [updated, setUpdated] = useState<{ id: number; section: Section } | null>(null);

  /* The app says when it can take a configuration, and when its window is drawn. */
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

  /*
   * Every answer reaches the window. When one changes a switch, the window
   * is also told which screen shows it, and opens that one.
   */
  const sent = useRef<Configuration | null>(null);
  useEffect(() => {
    if (!ready) return;
    const before = sent.current;
    sent.current = configuration;
    let section: Section | undefined;
    if (before && before.pack === configuration.pack) {
      const paths = changedPaths(before, configuration);
      const focus = paths.length > 0 ? focusFor(paths[0], configuration) : null;
      if (focus) {
        section = focus.section;
        setUpdated({ id: Date.now(), section });
      }
    }
    frame.current?.contentWindow?.postMessage({ type: "ouaqt:configuration", configuration, section }, window.location.origin);
  }, [ready, configuration]);

  useEffect(() => {
    if (!updated) return;
    const timer = setTimeout(() => setUpdated(null), UPDATED_MS);
    return () => clearTimeout(timer);
  }, [updated]);

  const enlarge = (next: boolean) => {
    setExpanded(next);
    onExpand?.(next);
  };

  useEffect(() => {
    if (!expanded) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") enlarge(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  const name =
    (configuration.language.app === "ar" && configuration.business.nameArabic) || configuration.business.nameLatin || words.shopPlaceholder;
  const large = expanded || fill;
  const mode: FitMode = large ? (actual ? "actual" : "contain") : "width";

  /*
   * One tree whatever the size, so the window is never taken out of the page
   * and put back: an iframe that moves is an iframe that reloads, and the
   * owner would lose the sale they were in the middle of.
   */
  return (
    <div
      className={cn(
        expanded
          ? "fixed inset-0 z-[70] flex flex-col gap-3 bg-background/95 p-4 backdrop-blur sm:p-8"
          : fill
            ? "flex h-full flex-col gap-3"
            : "space-y-3"
      )}
      role={expanded ? "dialog" : undefined}
      aria-modal={expanded ? true : undefined}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-base font-medium text-foreground">{copy.shell.previewTitle}</span>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-sm text-muted-foreground">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-app-success opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-app-success" />
            </span>
            {copy.preview.live}
          </span>
        </div>
        {fill ? null : (
          <button
            type="button"
            onClick={() => enlarge(!expanded)}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-border bg-surface px-4 text-base text-foreground transition-colors hover:border-foreground/40"
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {expanded ? copy.preview.shrink : copy.preview.expand}
          </button>
        )}
      </div>

      {fill ? <RotateHint copy={copy} hidden={actual} /> : null}

      <div className={large ? "min-h-0 flex-1" : undefined}>
        <Fit mode={mode}>
          <div
            className="overflow-hidden rounded-[18px] border-2 border-app-strong bg-app-background shadow-[0_30px_60px_-20px_rgba(10,10,10,0.35)]"
            style={{ width: APP_WIDTH, height: CANVAS_HEIGHT }}
          >
            <div className="relative flex items-center border-b border-app-line bg-app-hover px-4" style={{ height: TITLE_HEIGHT }}>
              <span className="flex gap-2" aria-hidden>
                <span className="h-3.5 w-3.5 rounded-full bg-app-strong" />
                <span className="h-3.5 w-3.5 rounded-full bg-app-strong" />
                <span className="h-3.5 w-3.5 rounded-full bg-app-strong" />
              </span>
              <span className="absolute inset-x-24 truncate text-center text-[15px] text-app-ink2">{name}</span>
            </div>
            <div className="relative" style={{ width: APP_WIDTH, height: APP_HEIGHT }}>
              <iframe
                ref={frame}
                src={APP_SOURCE}
                title={copy.shell.previewTitle}
                style={{ width: APP_WIDTH, height: APP_HEIGHT, border: 0, display: "block" }}
              />
              {started ? null : (
                <div className="absolute inset-0 flex items-center justify-center bg-app-background">
                  <p className="animate-pulse text-[22px] text-app-ink3">{copy.preview.loading}</p>
                </div>
              )}
            </div>
          </div>
        </Fit>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="min-h-[1.5rem] text-sm text-muted-foreground" aria-live="polite">
          {updated ? (
            <span className="inline-flex items-center gap-2 font-medium text-foreground">
              <span className="h-2 w-2 rounded-full bg-accent" />
              {copy.preview.updated.replace("{section}", words.nav[updated.section])}
            </span>
          ) : (
            copy.preview.hint
          )}
        </p>
        {large ? (
          <button
            type="button"
            onClick={() => setActual(!actual)}
            className="min-h-[48px] shrink-0 rounded-full border border-border px-4 text-base text-foreground"
          >
            {actual ? copy.preview.fitSize : copy.preview.actualSize}
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* A laptop window upright on a phone is a thin strip: the owner is told to turn the phone. */
function RotateHint({ copy, hidden }: { copy: BuilderCopy; hidden: boolean }) {
  const [upright, setUpright] = useState(false);
  useEffect(() => {
    const check = () => setUpright(window.innerHeight > window.innerWidth);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  if (!upright || hidden) return null;
  return (
    <p className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm text-foreground">
      <Smartphone className="h-4 w-4 shrink-0 rotate-90 text-accent" />
      {copy.preview.rotate}
    </p>
  );
}
