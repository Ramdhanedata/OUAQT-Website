import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { GradientMesh } from "@/components/motion/gradient-mesh";
import type { Dictionary } from "@/lib/i18n";
import { type Locale } from "@/lib/i18n/config";
import { localisedHref } from "@/lib/i18n/routes";
import { fill } from "@/lib/utils";
import { ArrowRight, Check, CirclePlay, Timer, WifiOff } from "lucide-react";
import type { CSSProperties } from "react";

/* Each line rises a moment after the one above (see .hero-enter in globals.css). */
const rise = (seconds: number) => ({ "--rise-delay": `${seconds}s` }) as CSSProperties;

/*
 * The first thing anyone sees: who OUAQT is for, what the Builder gives
 * them, and the software itself.
 *
 * The picture is a real screen of the software, taken from the same build
 * the demo further down runs, in the page's language. The reassurance line
 * names the trial length from settings; when settings cannot be read it
 * says the two things that are true regardless rather than inventing a
 * number of days.
 */
export function BuilderHero({
  dict,
  lang,
  trialDays,
}: {
  dict: Dictionary;
  lang: Locale;
  trialDays: number | null;
}) {
  const home = dict.builderHome;
  const reassurance = (trialDays ? fill(home.heroReassurance, { days: trialDays }) : home.heroReassuranceNoTrial).split(" · ");

  return (
    <section className="relative overflow-hidden">
      <GradientMesh />
      <Container className="grid items-center gap-14 pb-20 pt-10 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12 lg:pb-24 lg:pt-14">
        <div>
          <p className="hero-enter inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3.5 py-1.5 text-sm text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {home.heroEyebrow}
          </p>

          <h1
            style={rise(0.06)}
            className="hero-enter mt-6 text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-[3.1rem]"
          >
            {home.heroHeading}
          </h1>

          <p style={rise(0.12)} className="hero-enter mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {home.heroBody}
          </p>

          <div style={rise(0.2)} className="hero-enter mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button href={localisedHref(lang, "builder")} variant="accent" className="min-h-[48px] justify-center text-base">
              {home.heroPrimary}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
            <Button href="#demo" variant="outline" className="min-h-[48px] justify-center bg-surface/60 text-base">
              <CirclePlay className="h-4 w-4" />
              {home.heroSecondary}
            </Button>
          </div>

          <ul style={rise(0.28)} className="hero-enter mt-8 flex flex-wrap gap-x-6 gap-y-2">
            {reassurance.map((line) => (
              <li key={line} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 shrink-0 text-accent" />
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div style={rise(0.18)} className="hero-enter relative mx-auto w-full max-w-2xl lg:max-w-none">
          <div className="overflow-hidden rounded-2xl border border-black/10 bg-app-background shadow-[0_40px_80px_-32px_rgba(10,10,10,0.45)]">
            <div className="flex h-8 items-center gap-1.5 border-b border-app-line bg-app-hover px-3.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-app-strong" />
              <span className="h-2.5 w-2.5 rounded-full bg-app-strong" />
              <span className="h-2.5 w-2.5 rounded-full bg-app-strong" />
            </div>
            <Image
              src={`/images/product/till-${lang}.webp`}
              alt={home.heroShotAlt}
              width={1600}
              height={1000}
              priority
              sizes="(min-width: 1024px) 640px, (min-width: 640px) 90vw, 100vw"
              className="block h-auto w-full"
            />
          </div>

          <div className="absolute -bottom-6 start-4 flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-[0_16px_32px_-16px_rgba(10,10,10,0.35)] sm:-start-6">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-app-gold-ink">
              <WifiOff className="h-[18px] w-[18px]" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-foreground">{home.heroChipOffline}</span>
              <span className="block text-xs text-muted-foreground">{home.heroChipOfflineLabel}</span>
            </span>
          </div>

          <div className="absolute -top-4 end-4 hidden items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 text-sm font-medium text-foreground shadow-[0_12px_24px_-14px_rgba(10,10,10,0.35)] sm:flex sm:-end-4">
            <Timer className="h-4 w-4 text-accent" />
            {home.heroChipReady}
          </div>
        </div>
      </Container>
    </section>
  );
}
