import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { GradientMesh } from "@/components/motion/gradient-mesh";
import type { Dictionary } from "@/lib/i18n";
import { type Locale } from "@/lib/i18n/config";
import { localisedHref } from "@/lib/i18n/routes";
import { fill } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
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
      <Container className="grid items-center gap-14 pb-20 pt-10 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14 lg:pb-24 lg:pt-14">
        <div>
          <p className="hero-enter text-sm font-medium text-app-gold-ink">{home.heroEyebrow}</p>

          <h1
            style={rise(0.06)}
            className="hero-enter mt-5 text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-[3.1rem]"
          >
            {home.heroHeading}
          </h1>

          <p style={rise(0.12)} className="hero-enter mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {home.heroBody}
          </p>

          <div style={rise(0.2)} className="hero-enter mt-9 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <Button href={localisedHref(lang, "builder")} variant="accent" className="min-h-[48px] justify-center text-base">
              {home.heroPrimary}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
            <a
              href="#demo"
              className="inline-flex min-h-[48px] items-center justify-center text-base text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
            >
              {home.heroSecondary}
            </a>
          </div>

          <p style={rise(0.28)} className="hero-enter mt-8 text-sm text-muted-foreground">
            {reassurance.join("  ·  ")}
          </p>
        </div>

        <div style={rise(0.18)} className="hero-enter relative mx-auto w-full max-w-2xl lg:max-w-none">
          {/* A sticker on the picture's corner: how long it takes, said once and plainly. */}
          <p
            aria-label={home.heroChipReady}
            className="absolute -end-3 -top-6 z-10 flex h-[104px] w-[104px] rotate-[8deg] flex-col items-center justify-center rounded-full bg-accent text-center text-accent-foreground shadow-[0_12px_28px_-14px_rgba(10,10,10,0.45)] ring-4 ring-background rtl:-rotate-[8deg] sm:-end-6 sm:-top-8 sm:h-[116px] sm:w-[116px]"
          >
            <span aria-hidden className="text-xs font-medium leading-none">{home.heroStickerTop}</span>
            <span aria-hidden className="mt-1 text-2xl font-semibold leading-none tracking-tight sm:text-[1.7rem]">{home.heroStickerValue}</span>
          </p>
          <div className="overflow-hidden rounded-2xl border border-border bg-app-background shadow-[0_30px_60px_-36px_rgba(10,10,10,0.35)]">
            <div className="flex h-7 items-center gap-1.5 border-b border-app-line bg-app-hover px-3" aria-hidden>
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
        </div>
      </Container>
    </section>
  );
}
