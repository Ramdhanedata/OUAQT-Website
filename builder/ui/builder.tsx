"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { organization } from "@/lib/data/contact";
import type { Locale } from "@/lib/i18n/config";
import { cn, fill } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Eye, HeartHandshake, MessageCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Pack } from "@/app-ui/packs";
import type { BuilderCopy } from "@/builder/copy";
import { useDraft, type DraftAnswers, type SaveState } from "@/builder/draft/store";
import { record } from "@/builder/events";
import dynamic from "next/dynamic";
import { LeadForm } from "./lead-form";
import { BUSINESS_SCREENS, DETAILS_SCREEN, NAME_FIELD, StepBusiness } from "./step-business";
import { forgetOpened, numberFromLink, openFromLink, readOpened, SWITCHED_FLAG, type Opened } from "./config-code";
import { localisedHref } from "@/lib/i18n/routes";
import { InstallGuide } from "./install-guide";
import { InstallTargetProvider, useInstallTarget } from "./install-target";

/*
 * Two steps, and the owner fills in only the first: his shop (its trade, its
 * name, what goes on its receipts), then his software, ready to download or
 * to open on his phone. The questions each trade used to ask are gone (Adel,
 * 2026-11-17): every shop starts from its trade's usual settings.
 */
const STEP_KEYS = ["business", "serial"] as const;
const LAST_STEP = STEP_KEYS.length - 1;
/*
 * What the admin's funnel counts the last step as. It was the fourth step
 * when the questions and the products sat before it, and keeping its number
 * keeps the old counts and the new ones on the same line.
 */
const SERIAL_EVENT = 3; // not-a-rule: a step's place in the funnel table

/*
 * The preview carries the app screens, the receipt and the schema with it.
 * None of that is needed to choose a trade, and on a slow phone it would be
 * the difference between starting and giving up, so it is fetched separately
 * once the first screen is up.
 */
const Preview = dynamic(() => import("./preview").then((m) => m.Preview), {
  ssr: false,
});

const StepAccount = dynamic(
  () => import("./step-account").then((m) => m.StepAccount),
  { ssr: false }
);

/* Only for a configuration opened by code: its download. */
const ResumeDownload = dynamic(() => import("./resume").then((m) => m.ResumeDownload), { ssr: false });

const LANGUAGE_NAMES: Record<Locale, string> = { fr: "Français", ar: "العربية", en: "English" };

/* The width at which questions and preview stop taking turns and sit side by side. */
const WIDE = "(min-width: 900px)"; // not-a-rule: a layout breakpoint

/*
 * The builder shell: it opens straight on the first step, with no page of
 * its own to read first. Every link on the site that leads here has already
 * said what it is.
 *
 * Two layouts, chosen by width alone, never by sniffing the device. Below
 * 900px the owner sees one screen at a time with a fixed bar at the bottom.
 * From 900px the form sits beside a live preview of his own software, which
 * takes the larger share of the width and stays in view while he scrolls.
 */
export function Builder({
  copy,
  locale,
  enabledPacks,
  startPack,
  supportWhatsapp,
  installers,
  tutorials,
  termsHref,
  trialDays,
}: {
  copy: BuilderCopy;
  locale: Locale;
  enabledPacks: Pack[];
  startPack: Pack | null;
  supportWhatsapp: string | null;
  installers: Record<Pack, { windows: string | null; mac: string | null }>;
  tutorials: { windows: string | null; mac: string | null };
  termsHref: string;
  trialDays: number | null;
}) {
  const [step, setStep] = useState(0);
  const [offline, setOffline] = useState(false);
  const draft = useDraft(locale);

  /*
   * A configuration opened by code. Everything was answered on the phone, so
   * this computer shows its download and nothing else, with a note when the
   * page changed language to match it, and the way back.
   */
  const [opened, setOpened] = useState<Opened | null>(null);
  const [switchedFrom, setSwitchedFrom] = useState<Locale | null>(null);
  useEffect(() => {
    const found = readOpened();
    if (found?.pack) setOpened(found);
    else if (found) forgetOpened();
    try {
      const from = window.sessionStorage.getItem(SWITCHED_FLAG) as Locale | null;
      if (from) {
        window.sessionStorage.removeItem(SWITCHED_FLAG);
        setSwitchedFrom(from);
      }
    } catch {
      // No session storage: no note to show.
    }
  }, []);

  /* An expired code: the first step again, started on purpose, never silently. */
  const startOver = () => {
    forgetOpened();
    setStep(0);
  };

  /*
   * His own link, opened on another computer or phone: straight to his
   * shop's download, with the number it carries never shown. While it is
   * looked up the page says so; a link that leads nowhere says that instead.
   */
  const [linkState, setLinkState] = useState<"none" | "opening" | "unknown" | "expired" | "failed">("none");
  useEffect(() => {
    const number = numberFromLink();
    if (!number) return;
    setLinkState("opening");
    void openFromLink(number, locale).then((answer) => {
      if (answer !== "opened") setLinkState(answer);
    });
    // Once, when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  /*
   * The home page and each trade's page send the owner here with his trade
   * already chosen. That choice is the one he gets, whatever this browser
   * remembers: an older draft for another trade, or a shop opened earlier by
   * its number, must never answer for him. Nothing is lost: his other
   * answers stay in the draft, and the same trade simply carries on.
   */
  const [preselected, setPreselected] = useState(false);
  useEffect(() => {
    if (preselected || !draft.restored) return;
    if (!startPack || !enabledPacks.includes(startPack)) return;
    setPreselected(true);
    const found = readOpened();
    if (found && found.pack !== startPack) {
      forgetOpened();
      setOpened(null);
    }
    if (draft.answers.pack === startPack) return;
    /* What the AI set was for the other trade's features, and would not fit this one. */
    draft.update({ pack: startPack, patched: undefined });
    setStep(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselected, draft.restored, startPack]);

  const switchedNote = switchedFrom ? (
    <p className="mb-6 rounded-xl border border-border bg-muted px-4 py-3 text-base text-foreground">
      {fill(copy.code.switched, { language: LANGUAGE_NAMES[locale] })}{" "}
      <a href={localisedHref(switchedFrom, "builder")} className="underline underline-offset-4">
        {fill(copy.code.switchBack, { language: LANGUAGE_NAMES[switchedFrom] })}
      </a>
    </p>
  ) : null;

  if (linkState !== "none") {
    const whatsapp = supportWhatsapp ? `https://wa.me/${supportWhatsapp}` : organization.whatsappUrl;
    return (
      <div lang={locale}>
        <Container className="max-w-3xl py-16 wizard:py-24">
          {linkState === "opening" ? (
            <p role="status" className="text-lg text-muted-foreground">{copy.code.preparing}</p>
          ) : (
            <div role="alert" className="space-y-6">
              <p className="text-lg leading-relaxed text-foreground">
                {linkState === "expired" ? copy.link.expired : linkState === "unknown" ? copy.link.unknown : copy.code.downloadFailed}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="accent" onClick={() => setLinkState("none")} className="min-h-[48px] text-base">
                  {copy.code.another}
                </Button>
                <Button href={whatsapp} variant="outline" className="min-h-[48px] text-base">
                  <MessageCircle className="h-4 w-4" />
                  {copy.shell.help}
                </Button>
              </div>
            </div>
          )}
        </Container>
      </div>
    );
  }

  if (opened?.pack) {
    const whatsapp = supportWhatsapp ? `https://wa.me/${supportWhatsapp}` : organization.whatsappUrl;
    const stepName = copy.steps.serial as string;
    const help = `${whatsapp}?text=${encodeURIComponent(
      fill(copy.shell.helpMessage as string, { step: STEP_KEYS.length, name: stepName })
    )}`;
    const name = (locale === "ar" && opened.nameArabic) || opened.nameLatin;
    /*
     * The way most owners now reach their download: the number from the
     * phone, typed on the shop computer. It chooses Windows or Mac as step 4
     * does, or a Mac would be offered Windows with no way to change it.
     */
    return (
      <InstallTargetProvider>
      <div lang={locale}>
        <Container className="max-w-3xl py-8 wizard:py-12">
          {offline ? (
            <p className="mb-6 rounded-xl border border-border bg-muted px-4 py-3 text-base text-foreground">
              {copy.shell.offline}
            </p>
          ) : null}
          {switchedNote}
          <Progress copy={copy} step={LAST_STEP} total={STEP_KEYS.length} stepName={stepName} />
          <div className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <ResumeDownload
              copy={copy}
              language={locale}
              serial={opened.serial}
              made={Boolean(opened.made)}
              pack={opened.pack}
              name={name}
              installers={installers}
              tutorials={tutorials}
              trialDays={trialDays}
              supportWhatsapp={supportWhatsapp}
            />
          </div>
          {/*
            * This browser remembers the shop whose number was typed here, and
            * would show its download every time. Another trade starts from the
            * first step, never from that shop.
            */}
          <button
            type="button"
            onClick={() => {
              startOver();
              setOpened(null);
            }}
            className="mt-6 inline-flex min-h-[48px] items-center text-base font-medium text-foreground underline decoration-border underline-offset-4"
          >
            {copy.code.another}
          </button>
          <br />
          <a
            href={help}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex min-h-[48px] items-center gap-2 text-base text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
          >
            <MessageCircle className="h-4 w-4 text-accent" />
            {copy.shell.help}
          </a>
        </Container>
      </div>
      </InstallTargetProvider>
    );
  }

  return (
    <Wizard
      flush={draft.flush}
      copy={copy}
      locale={locale}
      step={step}
      stepName={copy.steps[STEP_KEYS[step]] as string}
      offline={offline}
      enabledPacks={enabledPacks}
      /* His trade came with the link: a phone opens on the shop's details, the trades one Retour away. */
      startOnDetails={Boolean(startPack && enabledPacks.includes(startPack))}
      supportWhatsapp={supportWhatsapp}
      installers={installers}
      tutorials={tutorials}
      termsHref={termsHref}
      answers={draft.answers}
      update={draft.update}
      saveState={draft.state}
      onStep={setStep}
    />
  );
}

function useWide(): boolean {
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(WIDE);
    const update = () => setWide(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return wide;
}

function Wizard({
  flush,
  copy,
  locale,
  step,
  stepName,
  offline,
  enabledPacks,
  startOnDetails,
  supportWhatsapp,
  installers,
  tutorials,
  termsHref,
  answers,
  update,
  saveState,
  onStep,
}: {
  copy: BuilderCopy;
  locale: Locale;
  step: number;
  stepName: string;
  offline: boolean;
  enabledPacks: Pack[];
  startOnDetails: boolean;
  supportWhatsapp: string | null;
  installers: Record<Pack, { windows: string | null; mac: string | null }>;
  tutorials: { windows: string | null; mac: string | null };
  termsHref: string;
  answers: DraftAnswers;
  update: (patch: DraftAnswers) => void;
  saveState: SaveState;
  onStep: (step: number) => void;
  flush: () => Promise<void>;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLarge, setPreviewLarge] = useState(false);
  /* The numéro de série, given once, when the first step ends. It opens the last one. */
  const [issued, setIssued] = useState<{ serial: string } | null>(null);
  /* While the number is being fetched the button says so, and taps wait. */
  const [issuing, setIssuing] = useState(false);
  /* The number could not be given: said by the button, which tries again. */
  const [issueFailed, setIssueFailed] = useState(false);

  async function issue(): Promise<boolean> {
    try {
      await flush();
      const response = await fetch("/api/builder/configuration-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          language: locale,
          ...(answers.logo && answers.logoMono ? { logo: answers.logo, logoMono: answers.logoMono } : {}),
          ...(!answers.logo && answers.logoRemoved ? { removeLogo: true } : {}),
        }),
      });
      const body = (await response.json().catch(() => null)) as { serial?: string } | null;
      if (!response.ok || !body?.serial) return false;
      setIssued({ serial: body.serial });
      return true;
    } catch {
      return false;
    }
  }
  const [screen, setScreen] = useState(startOnDetails ? DETAILS_SCREEN : 0);
  const [lead, setLead] = useState<{ pack: Pack | null } | null>(null);
  const [nameError, setNameError] = useState(false);
  const [packError, setPackError] = useState(false);
  const [serial, setSerial] = useState<string | null>(null);
  const wide = useWide();

  /*
   * A new screen opens at its own top. The button that brought him here sat
   * at the bottom of the last one, and left where it was the page would open
   * halfway down, with what he has to read above the fold, unseen.
   */
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step, screen]);

  /* The last step's code, fetched while he fills the first, so a slow phone network never shows it an empty box. */
  useEffect(() => {
    void import("./step-account");
  }, []);

  /* Which step he reached, so we can see where owners stop. */
  useEffect(() => {
    record("reached", step === LAST_STEP ? SERIAL_EVENT : step, answers.pack);
  }, [step, answers.pack]);

  /* The number this owner has now: the one issued as the last step opened, or one he opened. */
  const currentSerial = serial ?? issued?.serial ?? null;
  /* The journey's end: the last step, with a serial issued now or brought back from an earlier visit. */
  const finished = step === LAST_STEP && Boolean(currentSerial) && !lead;
  const whatsapp = supportWhatsapp
    ? `https://wa.me/${supportWhatsapp}`
    : organization.whatsappUrl;
  const help = `${whatsapp}?text=${encodeURIComponent(
    fill(copy.shell.helpMessage as string, { step: step + 1, name: stepName })
  )}`;

  const named = Boolean((answers.nameLatin ?? "").trim());
  const chosen = Boolean(answers.pack && enabledPacks.includes(answers.pack));

  const pack = answers.pack ?? enabledPacks[0] ?? "pharmacy";
  /* A trade whose computer version is not out yet has no file to install: no guide to one, and nothing that promises it. */
  const canInstall = Boolean(installers[pack]?.windows || installers[pack]?.mac);
  const showGuide = finished && canInstall;

  /* On a phone the trades are the first screen, and there is nothing before them to go back to. */
  const canGoBack = Boolean(lead) || step > 0 || (!wide && screen > 0);
  /* The press that makes the software: the whole form on a computer, its second screen on a phone. */
  const lastPress = step === 0 && (wide || screen >= BUSINESS_SCREENS - 1);

  function goBack() {
    if (lead) return setLead(null);
    if (!wide && screen > 0) return setScreen(screen - 1);
    if (step === 0) return;
    setScreen(BUSINESS_SCREENS - 1);
    onStep(step - 1);
  }

  function goNext() {
    if (issuing || step !== 0) return;

    /* The trade first: without one there is no software to make, and nobody is handed a pharmacy by default. */
    if (!chosen) {
      setPackError(true);
      if (!wide) setScreen(0);
      else window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setPackError(false);

    if (!wide && screen < DETAILS_SCREEN) return setScreen(screen + 1);

    /* The name is the one thing this step cannot finish without. */
    if (!named) {
      setNameError(true);
      /* The field may be a screen above the button: the cursor goes to it, and the page follows. */
      document.getElementById(NAME_FIELD)?.focus();
      return;
    }
    setNameError(false);

    /*
     * Straight to the serial and the download, on a computer and on a phone
     * alike. His products are imported in the software itself, from Stock,
     * when he has the file to hand. A number that cannot be given (no
     * network, most often) is said by the button, which tries again; if it
     * still cannot, the last step offers the account form instead and nothing
     * blocks him.
     */
    if (issued) return onStep(LAST_STEP);
    setIssuing(true);
    void issue().then((ok) => {
      setIssuing(false);
      if (ok || issueFailed) {
        setIssueFailed(false);
        return onStep(LAST_STEP);
      }
      setIssueFailed(true);
    });
  }

  const nextLabel = issuing ? copy.code.preparing : lastPress ? copy.shell.finish : copy.shell.next;

  const questionsPane = lead ? (
    <LeadForm
      copy={copy}
      pack={lead.pack}
      whatsappUrl={help}
      backLabel={copy.shell.back}
      onBack={() => setLead(null)}
    />
  ) : step === 0 ? (
    <StepBusiness
      copy={copy}
      locale={locale}
      enabledPacks={enabledPacks}
      answers={answers}
      update={update}
      screen={screen}
      wide={wide}
      onLead={(picked) => setLead({ pack: picked })}
      onPicked={() => {
        setPackError(false);
        if (!wide) setScreen(DETAILS_SCREEN);
      }}
      onChangePack={() => setScreen(0)}
      showNameError={nameError}
      showPackError={packError}
    />
  ) : (
    <StepAccount
      copy={copy}
      language={locale}
      pack={pack}
      answers={answers}
      products={[]}
      staff={answers.staff ?? []}
      termsHref={termsHref}
      installers={installers}
      tutorials={tutorials}
      /* The number issued as the first step ended is enough to download: no account needed first. */
      serial={currentSerial}
      onSerial={setSerial}
    />
  );

  const failedNote =
    issueFailed && step === 0 && !lead ? (
      <p role="alert" className="text-base leading-relaxed text-destructive">
        {copy.code.downloadFailed}
      </p>
    ) : null;

  return (
    <InstallTargetProvider>
    <div className="pb-24 wizard:pb-0" lang={locale}>
      {/*
        * Wider than the site's other pages: the preview is a laptop screen,
        * and every pixel it gets back is a bigger, more readable copy of the
        * owner's software.
        */}
      <Container className="py-8 wizard:max-w-[1560px] wizard:py-12">
        {offline ? (
          <p className="mb-6 rounded-xl border border-border bg-muted px-4 py-3 text-base text-foreground">
            {copy.shell.offline}
          </p>
        ) : null}

        <div className="grid gap-10 wizard:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] wizard:gap-10 xl:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] xl:gap-12">
          <div>
            <Progress copy={copy} step={step} total={STEP_KEYS.length} stepName={stepName} />

            <div className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
              {questionsPane}
            </div>

            {/* From 900px the two actions sit right under the form, before anything else. */}
            <div
              className={cn(
                "mt-6 hidden flex-col gap-3 wizard:flex",
                (lead || step !== 0) && "wizard:hidden"
              )}
            >
              <div className="flex items-center gap-3">
                {canGoBack ? (
                  <Button type="button" variant="outline" onClick={goBack} className="min-h-[52px] text-base">
                    <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                    {copy.shell.back}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="accent"
                  onClick={goNext}
                  disabled={issuing}
                  className="min-h-[52px] flex-1 text-base font-semibold disabled:opacity-70"
                >
                  {nextLabel}
                  {issuing ? null : <ArrowRight className="h-4 w-4 rtl:rotate-180" />}
                </Button>
              </div>
              {failedNote}
              <p className="text-base text-muted-foreground">{copy.shell.reassure}</p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1">
              {/* On a phone the preview is one tap away, on its own screen; beside the form there is no room for it. */}
              {step === 0 && !lead ? (
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="inline-flex min-h-[48px] items-center gap-2 text-base font-medium text-foreground underline decoration-border underline-offset-4 wizard:hidden"
                >
                  <Eye className="h-4 w-4 text-accent" />
                  {copy.shell.preview}
                </button>
              ) : null}
              <a
                href={help}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[48px] items-center gap-2 text-base text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
              >
                <MessageCircle className="h-4 w-4 text-accent" />
                {copy.shell.help}
              </a>
              <SaveNote copy={copy} state={saveState} />
            </div>

            {/*
              * Phone: one fixed bar, thumb height, always reachable.
              *
              * It steps aside for the "not on this list" form, which carries
              * its own send and back, and for the last step: once the
              * software is there, nothing is left to continue to, and a
              * thank-you takes its place.
              */}
            <div
              className={cn(
                "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur wizard:hidden",
                (lead || step !== 0) && "hidden"
              )}
            >
              <Container className="py-3">
                {failedNote ? <div className="mb-2">{failedNote}</div> : null}
                <div className="flex items-center gap-3">
                  {canGoBack ? (
                    <button
                      type="button"
                      onClick={goBack}
                      className="flex h-[52px] shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-border px-5 text-base font-medium text-foreground"
                    >
                      <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                      {copy.shell.back}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={issuing}
                    className="flex h-[52px] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-accent px-6 text-base font-semibold text-accent-foreground disabled:opacity-70"
                  >
                    {nextLabel}
                    {issuing ? null : <ArrowRight className="h-4 w-4 rtl:rotate-180" />}
                  </button>
                </div>
              </Container>
            </div>

            {/* The account form, shown only when no number could be given, keeps a way back to the shop's details. */}
            {step === LAST_STEP && !finished && !lead ? (
              <Button type="button" variant="outline" onClick={goBack} className="mt-6 min-h-[48px] text-base">
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                {copy.shell.back}
              </Button>
            ) : null}

            {finished ? (
              <Thanks
                copy={copy}
                pack={pack}
                shop={(locale === "ar" && answers.nameArabic) || answers.nameLatin || ""}
                canInstall={canInstall}
              />
            ) : null}
          </div>

          {/*
            * Only the preview that can be seen is built. Rendering the desktop
            * panel behind `hidden` as well as the phone overlay meant two
            * copies of the app screens on one page, both listening, both
            * re-rendering on every keystroke.
            */}
          {wide ? (
            /*
              * A sticky column keeps what it holds in its own layer, under the
              * site's header; while the window is enlarged, the column is lifted
              * above it.
              */
            <aside className={cn("self-start wizard:sticky wizard:top-24", previewLarge && "z-[70]")}>
              {/*
                * At the last step, with the serial issued, the software is
                * made: the space goes to how to install it on the computer
                * chosen on the left. The preview stays mounted underneath, so
                * going back a step finds it as it was.
                */}
              {showGuide ? (
                <div className="max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl">
                  <GuideForTarget copy={copy} pack={pack} shop={(locale === "ar" && answers.nameArabic) || answers.nameLatin || ""} />
                </div>
              ) : null}
              <div className={showGuide ? "hidden" : undefined}>
                <Preview copy={copy} answers={answers} fallbackLanguage={locale} onExpand={setPreviewLarge} />
              </div>
            </aside>
          ) : null}
        </div>
      </Container>

      {previewOpen && !wide ? (
        <div className="fixed inset-0 z-50 bg-background wizard:hidden">
          <Container className="flex h-full flex-col py-6">
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="mb-4 inline-flex min-h-[48px] items-center gap-2 self-start text-base text-muted-foreground"
            >
              <X className="h-4 w-4" />
              {copy.shell.close}
            </button>
            <div className="min-h-0 flex-1">
              <Preview copy={copy} answers={answers} fallbackLanguage={locale} fill />
            </div>
          </Container>
        </div>
      ) : null}
    </div>
    </InstallTargetProvider>
  );
}

/*
 * Where Continue was, once there is nothing left to continue to: thanks, by
 * the name of the software they are about to install.
 */
function Thanks({ copy, pack, shop, canInstall }: { copy: BuilderCopy; pack: Pack; shop: string; canInstall: boolean }) {
  const app = copy.thanks.names[pack] ?? copy.thanks.names.general;
  return (
    <div className="mt-8 flex gap-4 rounded-2xl border border-accent/40 bg-accent/10 p-6">
      <HeartHandshake aria-hidden className="mt-1 h-6 w-6 shrink-0 text-accent" />
      <div>
        <p className="text-xl font-semibold text-foreground">{fill(copy.thanks.title, { app })}</p>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          {!canInstall ? copy.thanks.bodyPhoneOnly : shop.trim() ? fill(copy.thanks.body, { shop: shop.trim() }) : copy.thanks.bodyNoShop}
        </p>
      </div>
    </div>
  );
}

/* The install guide for the computer chosen at step 4, beside the download. */
function GuideForTarget({ copy, pack, shop }: { copy: BuilderCopy; pack: Pack; shop: string }) {
  const { target, chip } = useInstallTarget();
  return <InstallGuide copy={copy} target={target} chip={chip} pack={pack} shop={shop} />;
}

function SaveNote({ copy, state }: { copy: BuilderCopy; state: SaveState }) {
  if (state === "idle") return null;
  const label =
    state === "saving"
      ? copy.save.saving
      : state === "saved"
        ? copy.save.saved
        : state === "failed"
          ? copy.save.failed
          : copy.save.unavailable;

  return <span className="text-base text-muted-foreground">{label}</span>;
}

function Progress({
  copy,
  step,
  total,
  stepName,
}: {
  copy: BuilderCopy;
  step: number;
  total: number;
  stepName: string;
}) {
  return (
    <div>
      <p className="text-base text-muted-foreground">
        {fill(copy.shell.stepOf as string, { current: step + 1, total })}
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {stepName}
      </h1>
      <div className="mt-5 flex gap-1.5" aria-hidden>
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={cn(
              "h-1 flex-1 rounded-full",
              index <= step ? "bg-accent" : "bg-border"
            )}
          />
        ))}
      </div>
    </div>
  );
}
