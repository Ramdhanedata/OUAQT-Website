"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { organization } from "@/lib/data/contact";
import type { Locale } from "@/lib/i18n/config";
import { cn, fill } from "@/lib/utils";
import { ArrowLeft, ArrowRight, MessageCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { BuilderCopy } from "@/builder/copy";

const STEP_KEYS = ["business", "questions", "products", "serial"] as const;

/*
 * The builder shell: the landing, then the four steps.
 *
 * Two layouts, chosen by width alone, never by sniffing the device. Below
 * 900px the owner sees one question at a time with a fixed bar at the bottom.
 * From 900px the questions sit beside a live preview of his own software.
 *
 * B0 ships the frame with the steps empty. The questions, the preview and the
 * saving of answers arrive in B1 and B2.
 */
export function Builder({
  copy,
  locale,
}: {
  copy: BuilderCopy;
  locale: Locale;
}) {
  const [step, setStep] = useState<number | null>(null);
  const [offline, setOffline] = useState(false);

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

  if (step === null) {
    return <Landing copy={copy} onStart={() => setStep(0)} />;
  }

  const stepName = copy.steps[STEP_KEYS[step]] as string;

  return (
    <Wizard
      copy={copy}
      locale={locale}
      step={step}
      stepName={stepName}
      offline={offline}
      onBack={() => setStep((current) => (current && current > 0 ? current - 1 : null))}
      onNext={() => setStep((current) => Math.min((current ?? 0) + 1, STEP_KEYS.length - 1))}
    />
  );
}

function Landing({ copy, onStart }: { copy: BuilderCopy; onStart: () => void }) {
  return (
    <section className="py-20 sm:py-28">
      <Container className="max-w-2xl">
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {copy.landing.title}
        </h1>
        <p className="mt-6 text-balance text-lg leading-relaxed text-muted-foreground">
          {copy.landing.intro}
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          {copy.landing.duration} · {copy.landing.noAccount}
        </p>

        <ol className="mt-10 space-y-4">
          {(copy.landing.steps as readonly string[]).map((label, index) => (
            <li key={label} className="flex gap-4">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-sm text-muted-foreground">
                {index + 1}
              </span>
              <span className="leading-relaxed text-foreground">{label}</span>
            </li>
          ))}
        </ol>

        <div className="mt-10">
          <Button type="button" variant="accent" onClick={onStart} className="w-full justify-center sm:w-auto">
            {copy.landing.start}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </div>
      </Container>
    </section>
  );
}

function Wizard({
  copy,
  locale,
  step,
  stepName,
  offline,
  onBack,
  onNext,
}: {
  copy: BuilderCopy;
  locale: Locale;
  step: number;
  stepName: string;
  offline: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const total = STEP_KEYS.length;
  const help = `${organization.whatsappUrl}?text=${encodeURIComponent(
    fill(copy.shell.helpMessage as string, { step: step + 1, name: stepName })
  )}`;

  return (
    <div className="pb-28 wizard:pb-0" lang={locale}>
      <Container className="py-8 wizard:py-12">
        {offline ? (
          <p className="mb-6 rounded-xl border border-border bg-muted px-4 py-3 text-sm text-foreground">
            {copy.shell.offline}
          </p>
        ) : null}

        <div className="grid gap-10 wizard:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] wizard:gap-14">
          <div>
            <Progress copy={copy} step={step} total={total} stepName={stepName} />

            <div className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
              <h2 className="text-xl font-medium tracking-tight text-foreground">
                {copy.placeholder.title}
              </h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {copy.placeholder.body}
              </p>
            </div>

            <a
              href={help}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
            >
              <MessageCircle className="h-4 w-4 text-accent" />
              {copy.shell.help}
            </a>

            {/* Phone: one fixed bar, thumb height, always reachable. */}
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur wizard:hidden">
              <Container className="py-3">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="mb-2 h-10 w-full rounded-full border border-border text-sm text-muted-foreground"
                >
                  {copy.shell.preview}
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onBack}
                    className="flex h-12 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-border px-5 text-sm font-medium text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                    {copy.shell.back}
                  </button>
                  <button
                    type="button"
                    onClick={onNext}
                    className="flex h-12 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-accent px-6 text-sm font-medium text-accent-foreground"
                  >
                    {copy.shell.next}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </button>
                </div>
              </Container>
            </div>

            {/* From 900px the same two actions sit under the question. */}
            <div className="mt-8 hidden items-center gap-3 wizard:flex">
              <Button type="button" variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                {copy.shell.back}
              </Button>
              <Button type="button" variant="accent" onClick={onNext}>
                {copy.shell.next}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </div>
          </div>

          <aside className="hidden wizard:block">
            <PreviewPanel copy={copy} />
          </aside>
        </div>
      </Container>

      {previewOpen ? (
        <div className="fixed inset-0 z-50 bg-background wizard:hidden">
          <Container className="flex h-full flex-col py-6">
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="mb-6 inline-flex items-center gap-2 self-start text-sm text-muted-foreground"
            >
              <X className="h-4 w-4" />
              {copy.shell.close}
            </button>
            <PreviewPanel copy={copy} />
          </Container>
        </div>
      ) : null}
    </div>
  );
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
      <p className="text-sm text-muted-foreground">
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

function PreviewPanel({ copy }: { copy: BuilderCopy }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/40 p-6">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {copy.shell.previewTitle}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {copy.shell.previewEmpty}
      </p>
    </div>
  );
}
