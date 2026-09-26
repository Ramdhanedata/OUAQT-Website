"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Maximize2, Minimize2, Smartphone } from "lucide-react";
import {
  Receipt,
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
import type { ImportedProduct } from "@/builder/import/parse";
import { cn } from "@/lib/utils";
import { APP_HEIGHT, APP_WIDTH, AppWindow, TITLE_HEIGHT, receiptLines } from "./app";
import { catalogueFor, changedPaths, focusFor, sectionsFor, type Item, type Section } from "./model";
import { Preview as PreviewContext, newDay, nextId, usePreview, type Day, type PreviewContext as Context, type Staff } from "./store";
import { SAMPLE_TABLE } from "./samples";
import { wordsFor } from "./words";

/*
 * The owner's own software, running, while they are still describing it.
 *
 * Everything in the window comes from what they have answered so far, with
 * the defaults every unanswered question would take: the preview runs on the
 * same configuration the app will, not on a drawing of one. It is a working
 * copy, too. A sale rung up here prints its receipt, lowers the stock and
 * lands in the report; a table sent to the kitchen waits at the bottom of
 * the screen until it is paid.
 *
 * When an answer changes something, the window goes to the screen it
 * changed and marks it, so the owner sees what the answer did.
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

/* A restaurant's day starts with a table already eating, so the waiting orders are never an empty strip. */
function startOfDay(configuration: Configuration, items: Item[]): Day {
  const [drink, , , dish] = items;
  if (configuration.pack !== "restaurant" || !drink || !dish) return newDay();
  const since = new Date(Date.now() - SAMPLE_TABLE.seatedMinutes * 60_000);
  const line = (item: Item, quantity: number) => ({ key: `${item.id}|`, itemId: item.id, name: item.name, price: item.price, quantity });
  return newDay([
    {
      id: "o-sample",
      label: `${wordsFor(configuration.language.app).till.table} ${SAMPLE_TABLE.number}`,
      table: SAMPLE_TABLE.number,
      lines: [line(drink, SAMPLE_TABLE.drinks), line(dish, 1)],
      since,
    },
  ]);
}

type View = "app" | "receipt";

export function Preview({
  copy,
  answers,
  fallbackLanguage,
  products,
  fill = false,
}: {
  copy: BuilderCopy;
  answers: DraftAnswers;
  fallbackLanguage: AppLanguage;
  /** The owner's own products, once imported at step 3. */
  products?: ImportedProduct[] | null;
  /** Fill the height it is given, as the full-screen view on a phone does, rather than follow the width. */
  fill?: boolean;
}) {
  const configuration = useMemo(() => configurationFrom(answers, fallbackLanguage), [answers, fallbackLanguage]);
  const language = configuration.language.app;
  const words = wordsFor(language);
  const items = useMemo(() => catalogueFor(configuration, products), [configuration, products]);
  const sections = sectionsFor(configuration);

  const [chosen, setChosen] = useState<Section>(sections[0]);
  const section = sections.includes(chosen) ? chosen : sections[0];
  const [day, setDay] = useState<Day>(() => startOfDay(configuration, items));
  const [view, setView] = useState<View>("app");
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<"tables" | null>(null);
  const [glow, setGlow] = useState<{ id: number; section: Section } | null>(null);

  /*
   * What changed since the last answer. A new trade is a new app, so it
   * starts a new day; anything else moves the window to where it shows.
   */
  const previous = useRef(configuration);
  useEffect(() => {
    const before = previous.current;
    previous.current = configuration;
    if (before === configuration) return;
    if (before.pack !== configuration.pack) {
      setDay(startOfDay(configuration, catalogueFor(configuration, products)));
      setChosen(sectionsFor(configuration)[0]);
      setGlow(null);
      return;
    }
    const paths = changedPaths(before, configuration);
    if (paths.length === 0) return;
    const focus = focusFor(paths[0], configuration);
    if (!focus) return;
    setChosen(focus.section);
    setView("app");
    setDetail(focus.detail ?? null);
    setGlow({ id: nextId(), section: focus.section });
  }, [configuration, products]);

  /* The glow marks the change for a moment, then the status line goes back to its hint. */
  useEffect(() => {
    if (!glow) return;
    const timer = setTimeout(() => setGlow(null), 4500); // not-a-rule: ms the change stays marked
    return () => clearTimeout(timer);
  }, [glow]);

  const staff: Staff[] = useMemo(
    () => (answers.staff ?? []).filter((one) => one.name.trim() !== "").map((one) => ({ name: one.name.trim(), role: one.role })),
    [answers.staff]
  );
  const update = useCallback((change: (day: Day) => Day) => setDay(change), []);
  const say = useCallback((text: string) => setDay((current) => ({ ...current, note: { id: nextId(), text } })), []);
  const clearDetail = useCallback(() => setDetail(null), []);

  const context: Context = {
    configuration,
    language,
    words,
    items,
    staff,
    day,
    update,
    say,
    go: setChosen,
    detail,
    clearDetail,
  };

  useEffect(() => {
    if (!expanded) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setExpanded(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [expanded]);

  const renderWindow = (mode: FitMode) =>
    view === "app" ? (
      <Fit mode={mode}>
        <AppWindow section={section} onSection={setChosen} glow={glow} />
      </Fit>
    ) : (
      <ReceiptView copy={copy} fit={mode !== "width"} />
    );

  const toolbar = (large: boolean) => (
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
      <div className="flex items-center gap-2">
        <div role="tablist" className="flex rounded-full border border-border bg-surface p-1">
          {(["app", "receipt"] as View[]).map((one) => (
            <button
              key={one}
              type="button"
              role="tab"
              aria-selected={view === one}
              onClick={() => setView(one)}
              className={cn(
                "min-h-[40px] rounded-full px-4 text-base transition-colors",
                view === one ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {one === "app" ? copy.preview.app : copy.preview.receipt}
            </button>
          ))}
        </div>
        {fill ? null : (
          <button
            type="button"
            onClick={() => setExpanded(!large)}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-border bg-surface px-4 text-base text-foreground transition-colors hover:border-foreground/40"
          >
            {large ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {large ? copy.preview.shrink : copy.preview.expand}
          </button>
        )}
      </div>
    </div>
  );

  const status = (
    <p className="min-h-[1.5rem] text-sm text-muted-foreground" aria-live="polite">
      {glow ? (
        <span className="inline-flex items-center gap-2 font-medium text-foreground">
          <span className="h-2 w-2 rounded-full bg-accent" />
          {copy.preview.updated.replace("{section}", words.nav[glow.section])}
        </span>
      ) : view === "receipt" ? (
        day.sales.length > 0 ? copy.preview.lastReceipt : copy.preview.sampleReceipt
      ) : (
        <>
          {copy.preview.hint}
          {products && products.length > 0 ? null : <> {copy.preview.samples}</>}
        </>
      )}
    </p>
  );

  return (
    <PreviewContext.Provider value={context}>
      {fill ? (
        <FillLayout copy={copy} toolbar={toolbar(false)} status={status} render={renderWindow} />
      ) : (
        <div className="space-y-3">
          {toolbar(false)}
          {expanded ? (
            <div className="flex aspect-[1200/790] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
              {copy.preview.expand}
            </div>
          ) : (
            renderWindow("width")
          )}
          {status}
        </div>
      )}

      {/*
        * The enlarged window goes on the page itself: inside the sticky
        * column it would sit under the site's own header, whatever its
        * z-index, because a sticky box keeps its children in its own layer.
        */}
      {expanded && !fill
        ? createPortal(
            <div className="fixed inset-0 z-[70] flex flex-col gap-3 bg-background/95 p-4 backdrop-blur sm:p-8" role="dialog" aria-modal="true">
              {toolbar(true)}
              <div className="min-h-0 flex-1">{renderWindow("contain")}</div>
              {status}
            </div>,
            document.body
          )
        : null}
    </PreviewContext.Provider>
  );
}

/*
 * On a phone the preview has the whole screen. Upright, a laptop window is a
 * thin strip across it, so the owner is told to turn the phone, and can also
 * see the window at its real size and move around in it.
 */
function FillLayout({
  copy,
  toolbar,
  status,
  render,
}: {
  copy: BuilderCopy;
  toolbar: ReactNode;
  status: ReactNode;
  render: (mode: FitMode) => ReactNode;
}) {
  const [actual, setActual] = useState(false);
  const [upright, setUpright] = useState(false);
  useEffect(() => {
    const check = () => setUpright(window.innerHeight > window.innerWidth);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div className="flex h-full flex-col gap-3">
      {toolbar}
      {upright && !actual ? (
        <p className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm text-foreground">
          <Smartphone className="h-4 w-4 shrink-0 rotate-90 text-accent" />
          {copy.preview.rotate}
        </p>
      ) : null}
      <div className="min-h-0 flex-1">{render(actual ? "actual" : "contain")}</div>
      <div className="flex items-center justify-between gap-3">
        {status}
        <button
          type="button"
          onClick={() => setActual(!actual)}
          className="min-h-[48px] shrink-0 rounded-full border border-border px-4 text-base text-foreground"
        >
          {actual ? copy.preview.fitSize : copy.preview.actualSize}
        </button>
      </div>
    </div>
  );
}

type FitMode = "width" | "contain" | "actual";

const CANVAS_HEIGHT = APP_HEIGHT + TITLE_HEIGHT;

/*
 * Scales the window, never reflows it. "width" follows the column it sits
 * in, "contain" fits a box on both sides, "actual" draws it at its real size
 * and lets the box scroll. The window is held left to right whatever the
 * page is doing, so an Arabic page does not push the scaled copy out of
 * sight; the app inside still sets its own direction.
 */
function Fit({ mode, children }: { mode: FitMode; children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const element = outer.current;
    if (!element) return;
    const measure = () => setBox({ width: element.clientWidth, height: element.clientHeight });
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  if (mode === "actual") {
    return (
      <div ref={outer} dir="ltr" className="h-full w-full overflow-auto rounded-xl">
        <div style={{ width: APP_WIDTH, height: CANVAS_HEIGHT }}>{children}</div>
      </div>
    );
  }

  const scale =
    mode === "width" ? box.width / APP_WIDTH : Math.min(box.width / APP_WIDTH, box.height / CANVAS_HEIGHT);
  const left = mode === "contain" ? (box.width - APP_WIDTH * scale) / 2 : 0;
  const top = mode === "contain" ? (box.height - CANVAS_HEIGHT * scale) / 2 : 0;

  return (
    <div
      ref={outer}
      dir="ltr"
      className={cn("relative w-full", mode === "contain" ? "h-full" : undefined)}
      style={mode === "width" ? { aspectRatio: `${APP_WIDTH} / ${CANVAS_HEIGHT}` } : undefined}
    >
      {box.width > 0 ? (
        <div
          className="absolute origin-top-left"
          style={{ width: APP_WIDTH, height: CANVAS_HEIGHT, left, top, transform: `scale(${scale})` }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

/*
 * The 80mm receipt at a size that can be read: the last sale's when there
 * is one, a sample until then. Shown flat, not scaled with the window,
 * because this is the one screen where the owner reads every line.
 */
function ReceiptView({ copy, fit }: { copy: BuilderCopy; fit: boolean }) {
  const { configuration, words, items, day } = usePreview();
  const last = day.sales[day.sales.length - 1];
  const sample = items.slice(0, 3).map((item, index) => ({
    key: item.id,
    itemId: item.id,
    name: item.name,
    price: item.price,
    quantity: index === 0 ? 2 : 1,
  }));
  const lines = last ? receiptLines(last.lines, last.discount, words.till.discountLine) : receiptLines(sample, 0, "");

  return (
    <div
      className={cn("overflow-auto rounded-xl border border-border bg-app-hover p-6", fit ? "h-full" : "aspect-[1200/790]")}
      aria-label={copy.preview.receipt}
    >
      {configuration.common.printedReceipt ? null : (
        <p className="mx-auto mb-4 max-w-[340px] rounded-lg bg-app-warning-soft px-4 py-3 text-base text-app-warning">
          {words.settings.noPrinter}
        </p>
      )}
      <div className={cn("mx-auto w-full max-w-[340px] shadow-lg", !configuration.common.printedReceipt && "opacity-50")}>
        <Receipt configuration={configuration} lines={lines} number={last?.number ?? 1} at={last?.at} />
      </div>
    </div>
  );
}

