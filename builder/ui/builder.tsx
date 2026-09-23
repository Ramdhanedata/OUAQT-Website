"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { organization } from "@/lib/data/contact";
import type { Locale } from "@/lib/i18n/config";
import { cn, fill } from "@/lib/utils";
import { ArrowLeft, ArrowRight, MessageCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Pack } from "@/app-ui/packs";
import type { BuilderCopy } from "@/builder/copy";
import { useDraft, type DraftAnswers, type SaveState } from "@/builder/draft/store";
import { record } from "@/builder/events";
import dynamic from "next/dynamic";
import type { ImportedProduct } from "@/builder/import/parse";
import { LeadForm } from "./lead-form";
import { BUSINESS_SCREENS, StepBusiness } from "./step-business";

const STEP_KEYS = ["business", "questions", "products", "serial"] as const;

/*
 * The preview carries the app screens, the receipt and the schema with it.
 * None of that is needed to read the first question, and on a slow phone it
 * would be the difference between answering and giving up, so it is fetched
 * separately once the questions are on screen.
 */
const Preview = dynamic(() => import("./preview").then((m) => m.Preview), {
  ssr: false,
});

/* Step 2 brings the question banks and the schema with it. See step-two.tsx. */
const StepTwo = dynamic(() => import("./step-two").then((m) => m.StepTwo), {
  ssr: false,
});

/* Step 3 brings the spreadsheet reader, which is the heaviest thing here. */
const StepProducts = dynamic(
  () => import("./step-products").then((m) => m.StepProducts),
  { ssr: false }
);

const StepAccount = dynamic(
  () => import("./step-account").then((m) => m.StepAccount),
  { ssr: false }
);

/* The width at which questions and preview stop taking turns and sit side by side. */
const WIDE = "(min-width: 900px)"; // not-a-rule: a layout breakpoint

/*
 * The builder shell: the landing, then the four steps.
 *
 * Two layouts, chosen by width alone, never by sniffing the device. Below
 * 900px the owner sees one question at a time with a fixed bar at the bottom.
 * From 900px the questions sit beside a live preview of his own software.
 *
 * Step 1 is built. Steps 2 to 4 say so plainly and offer WhatsApp, rather
 * than showing an empty frame.
 */
export function Builder({
  copy,
  locale,
  enabledPacks,
  startPack,
  supportWhatsapp,
  maxDevices,
  installers,
  tutorials,
  termsHref,
}: {
  copy: BuilderCopy;
  locale: Locale;
  enabledPacks: Pack[];
  startPack: Pack | null;
  supportWhatsapp: string | null;
  maxDevices: number | null;
  installers: Record<Pack, { windows: string | null; mac: string | null }>;
  tutorials: { windows: string | null; mac: string | null };
  termsHref: string;
}) {
  const [step, setStep] = useState<number | null>(null);
  const [offline, setOffline] = useState(false);
  const draft = useDraft(locale);

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

  const started = Object.keys(draft.answers).length > 0;

  /*
   * A trade's landing page sends the owner here with his trade already
   * chosen, so he does not answer the same question twice. It is applied once
   * the draft has been read back, and never over answers he already gave:
   * arriving from a link is not a reason to lose an afternoon's work.
   */
  const [preselected, setPreselected] = useState(false);
  useEffect(() => {
    if (preselected || !draft.restored) return;
    if (!startPack || !enabledPacks.includes(startPack)) return;
    setPreselected(true);
    if (Object.keys(draft.answers).length > 0) return;
    draft.update({ pack: startPack });
    setStep(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselected, draft.restored, startPack]);

  if (step === null) {
    return (
      <Landing
        copy={copy}
        canResume={started && draft.restored}
        onStart={() => setStep(0)}
      />
    );
  }

  return (
    <Wizard
      copy={copy}
      locale={locale}
      step={step}
      stepName={copy.steps[STEP_KEYS[step]] as string}
      offline={offline}
      enabledPacks={enabledPacks}
      supportWhatsapp={supportWhatsapp}
      maxDevices={maxDevices}
      installers={installers}
      tutorials={tutorials}
      termsHref={termsHref}
      answers={draft.answers}
      update={draft.update}
      saveState={draft.state}
      onLeave={() => setStep(null)}
      onStep={setStep}
    />
  );
}

function Landing({
  copy,
  canResume,
  onStart,
}: {
  copy: BuilderCopy;
  canResume: boolean;
  onStart: () => void;
}) {
  return (
    <section className="py-20 sm:py-28">
      <Container className="max-w-2xl">
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {copy.landing.title}
        </h1>
        <p className="mt-6 text-balance text-lg leading-relaxed text-muted-foreground">
          {copy.landing.intro}
        </p>
        <p className="mt-4 text-base text-muted-foreground">
          {copy.landing.duration} · {copy.landing.noAccount}
        </p>

        <ol className="mt-10 space-y-4">
          {(copy.landing.steps as readonly string[]).map((label, index) => (
            <li key={label} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-base text-muted-foreground">
                {index + 1}
              </span>
              <span className="pt-1 text-base leading-relaxed text-foreground">
                {label}
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button type="button" variant="accent" onClick={onStart} className="min-h-[48px] text-base">
            {canResume ? copy.landing.resume : copy.landing.start}
          </Button>
        </div>
      </Container>
    </section>
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
  copy,
  locale,
  step,
  stepName,
  offline,
  enabledPacks,
  supportWhatsapp,
  maxDevices,
  installers,
  tutorials,
  termsHref,
  answers,
  update,
  saveState,
  onLeave,
  onStep,
}: {
  copy: BuilderCopy;
  locale: Locale;
  step: number;
  stepName: string;
  offline: boolean;
  enabledPacks: Pack[];
  supportWhatsapp: string | null;
  maxDevices: number | null;
  installers: Record<Pack, { windows: string | null; mac: string | null }>;
  tutorials: { windows: string | null; mac: string | null };
  termsHref: string;
  answers: DraftAnswers;
  update: (patch: DraftAnswers) => void;
  saveState: SaveState;
  onLeave: () => void;
  onStep: (step: number) => void;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [screen, setScreen] = useState(0);
  const [lead, setLead] = useState<{ pack: Pack | null } | null>(null);
  const [nameError, setNameError] = useState(false);
  /* Step 2 reports how many screens it has, since that depends on the answers. */
  const [interviewScreens, setInterviewScreens] = useState(1);
  /*
   * The product list is held here rather than in the draft. Ten thousand rows
   * do not belong in a browser's storage, and they are written to the
   * database the moment there is an account to attach them to.
   */
  const [keptProducts, setKeptProducts] = useState<ImportedProduct[] | null>(null);
  const [serial, setSerial] = useState<string | null>(null);
  const wide = useWide();

  /* Which step he reached, so we can see where owners stop. */
  useEffect(() => {
    record("reached", step, answers.pack);
  }, [step, answers.pack]);

  const total = STEP_KEYS.length;
  const whatsapp = supportWhatsapp
    ? `https://wa.me/${supportWhatsapp}`
    : organization.whatsappUrl;
  const help = `${whatsapp}?text=${encodeURIComponent(
    fill(copy.shell.helpMessage as string, { step: step + 1, name: stepName })
  )}`;

  /* The name is the one answer step 1 cannot finish without. */
  const NAME_SCREEN = 2; // not-a-rule: which of the five screens asks the name
  const named = Boolean((answers.nameLatin ?? "").trim());

  const pack = answers.pack ?? enabledPacks[0] ?? "pharmacy";

  function goBack() {
    if (lead) return setLead(null);
    if (!wide && screen > 0) return setScreen(screen - 1);
    if (step === 0) return onLeave();
    setScreen(0);
    onStep(step - 1);
  }

  function goNext() {
    if (step === 1) {
      if (!wide && screen < interviewScreens - 1) return setScreen(screen + 1);
      setScreen(0);
      return onStep(2);
    }
    if (step !== 0) return onStep(Math.min(step + 1, total - 1));

    const leavingName = wide || screen >= NAME_SCREEN;
    if (leavingName && !named) {
      setNameError(true);
      if (!wide) setScreen(NAME_SCREEN);
      return;
    }
    setNameError(false);

    if (!wide && screen < BUSINESS_SCREENS - 1) return setScreen(screen + 1);
    setScreen(0);
    onStep(1);
  }

  function answerQuestion(id: string, answer: unknown) {
    update({
      interview: { ...(answers.interview ?? {}), [id]: answer as never },
    });
  }

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
      onLead={(chosen) => setLead({ pack: chosen })}
      showNameError={nameError}
    />
  ) : step === 1 ? (
    <StepTwo
      copy={copy}
      language={locale}
      pack={pack}
      answers={answers}
      onAnswer={answerQuestion}
      onFeatures={(patch) => update({ patched: patch })}
      onEdit={(target) => {
        setScreen(0);
        onStep(target);
      }}
      onCount={setInterviewScreens}
      maxDevices={maxDevices}
      screen={screen}
      wide={wide}
    />
  ) : step === 2 ? (
    <StepProducts
      copy={copy}
      language={locale}
      pack={pack}
      kept={keptProducts}
      onKeep={setKeptProducts}
      staff={answers.staff ?? []}
      onStaff={(next) => update({ staff: next })}
    />
  ) : (
    <StepAccount
      copy={copy}
      language={locale}
      pack={pack}
      answers={answers}
      products={keptProducts ?? []}
      staff={answers.staff ?? []}
      termsHref={termsHref}
      installers={installers}
      tutorials={tutorials}
      serial={serial}
      onSerial={setSerial}
    />
  );

  return (
    <div className="pb-28 wizard:pb-0" lang={locale}>
      <Container className="py-8 wizard:py-12">
        {offline ? (
          <p className="mb-6 rounded-xl border border-border bg-muted px-4 py-3 text-base text-foreground">
            {copy.shell.offline}
          </p>
        ) : null}

        <div className="grid gap-10 wizard:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] wizard:gap-14">
          <div>
            <Progress copy={copy} step={step} total={total} stepName={stepName} />

            <div className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
              {questionsPane}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
              <SaveNote copy={copy} state={saveState} />
              <a
                href={help}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[48px] items-center gap-2 text-base text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
              >
                <MessageCircle className="h-4 w-4 text-accent" />
                {copy.shell.help}
              </a>
            </div>

            {/*
              * Phone: one fixed bar, thumb height, always reachable.
              *
              * It steps aside for the "not on this list" form, which carries
              * its own send and back. Two Continue buttons on one screen, one
              * of which skips the form, is how an owner loses his answer.
              */}
            <div
              className={cn(
                "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur wizard:hidden",
                /*
                 * The last step keeps Retour until the serial exists: until
                 * then he may still want to fix a product or a name. Once it
                 * is issued there is nothing after it to continue to.
                 */
                (lead || (step === 3 && serial)) && "hidden"
              )}
            >
              <Container className="py-3">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="mb-2 h-12 w-full rounded-full border border-border text-base text-muted-foreground"
                >
                  {copy.shell.preview}
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={goBack}
                    className="flex h-12 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-border px-5 text-base font-medium text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                    {copy.shell.back}
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="flex h-12 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-accent px-6 text-base font-medium text-accent-foreground"
                  >
                    {copy.shell.next}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </button>
                </div>
              </Container>
            </div>

            {/* From 900px the same two actions sit under the question. */}
            <div
              className={cn(
                "mt-8 hidden items-center gap-3 wizard:flex",
                (lead || (step === 3 && serial)) && "wizard:hidden"
              )}
            >
              <Button type="button" variant="outline" onClick={goBack} className="min-h-[48px] text-base">
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                {copy.shell.back}
              </Button>
              <Button type="button" variant="accent" onClick={goNext} className="min-h-[48px] text-base">
                {copy.shell.next}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </div>
          </div>

          {/*
            * Only the preview that can be seen is built. Rendering the desktop
            * panel behind `hidden` as well as the phone overlay meant two
            * copies of the app screens on one page, both listening, both
            * re-rendering on every keystroke.
            */}
          {wide ? (
            <aside>
              <div className="h-[36rem] overflow-hidden rounded-2xl border border-border bg-surface">
                <Preview copy={copy} answers={answers} fallbackLanguage={locale} />
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
            <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-border">
              <Preview copy={copy} answers={answers} fallbackLanguage={locale} />
            </div>
          </Container>
        </div>
      ) : null}
    </div>
  );
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
