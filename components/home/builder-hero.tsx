import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Laptop, Phone } from "@/components/home/devices";
import { getBuilderCopy } from "@/builder/copy";
import type { Dictionary } from "@/lib/i18n";
import { type Locale } from "@/lib/i18n/config";
import { localisedHref } from "@/lib/i18n/routes";
import { fill } from "@/lib/utils";
import { ArrowRight, Check, Monitor, Play, Smartphone, Timer } from "lucide-react";
import type { CSSProperties } from "react";

/* Each line rises a moment after the one above (see .hero-enter in globals.css). */
const rise = (seconds: number) => ({ "--rise-delay": `${seconds}s` }) as CSSProperties;

/*
 * The first thing anyone sees: what the software does, that it runs on a
 * computer and a phone, and the two side by side.
 *
 * Both pictures are real screens of the software, taken from the same build
 * the demo further down runs (scripts/product-shots.mjs), in the page's
 * language: a cafe with an order going on the computer, and the same cafe on
 * a phone. The reassurance line names the trial length from settings; when
 * settings cannot be read it says the things that are true regardless rather
 * than inventing a number of days.
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
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="grid-fade absolute inset-0" />
        <div className="glow-gold absolute left-1/2 top-[52%] h-[46rem] w-[min(78rem,160vw)] -translate-x-1/2 opacity-80" />
      </div>

      <Container className="pt-10 text-center sm:pt-16 lg:pt-20">
        <p
          className="hero-enter inline-flex items-center gap-2.5 rounded-full border border-border bg-surface/80 py-1.5 pe-4 ps-1.5 text-sm text-foreground shadow-card backdrop-blur"
        >
          <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1 text-background" aria-hidden>
            <Monitor className="h-3.5 w-3.5" />
            <Smartphone className="h-3.5 w-3.5" />
          </span>
          {home.heroEyebrow}
        </p>

        <h1
          style={rise(0.06)}
          className="hero-enter mx-auto mt-7 max-w-4xl text-balance text-[2.5rem] font-semibold leading-[1.05] tracking-display text-foreground sm:text-6xl lg:text-[4.6rem]"
        >
          {home.heroHeading}
        </h1>

        <p style={rise(0.12)} className="hero-enter mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
          {home.heroBody}
        </p>

        <div style={rise(0.2)} className="hero-enter mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Button href={localisedHref(lang, "builder")} variant="primary" className="min-h-[52px] px-7 text-base">
            {home.heroPrimary}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
          <a
            href="#demo"
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-border bg-surface/80 px-7 text-base font-medium text-foreground backdrop-blur transition-colors hover:border-foreground/40"
          >
            <Play className="h-4 w-4 fill-current rtl:rotate-180" />
            {home.heroSecondary}
          </a>
        </div>

        {/*
          * The owner who built his software on his phone is told to come
          * here on the shop computer and choose this, in these words: the
          * builder's own label, so the two never drift apart. It opens the
          * builder with the box for the number already open.
          */}
        <a
          href={`${localisedHref(lang, "builder")}?serial=1`}
          style={rise(0.24)}
          className="hero-enter mt-3 inline-flex min-h-[44px] items-center justify-center text-sm text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
        >
          {getBuilderCopy(lang).code.have}
        </a>

        <ul style={rise(0.28)} className="hero-enter mx-auto mt-5 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {reassurance.map((line) => (
            <li key={line} className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-app-gold-ink" strokeWidth={2.25} />
              {line}
            </li>
          ))}
        </ul>
      </Container>

      {/*
        * The computer and the phone together, the phone resting on the
        * corner where the app keeps its menu, whose lower part is empty: the
        * left in French and English, the right in Arabic, as the app itself
        * is mirrored. So the phone never covers the ticket or its total.
        */}
      <Container className="relative mt-14 pb-16 sm:mt-20 sm:pb-24">
        <div style={rise(0.18)} className="hero-enter relative mx-auto max-w-5xl pb-[4%] ps-[12%] sm:ps-[11%]">
          <Laptop>
            <Image
              src={`/images/product/hero-computer-${lang}.webp`}
              alt={home.heroShotAlt}
              width={1600}
              height={1000}
              priority
              sizes="(min-width: 1100px) 880px, 88vw"
              className="block h-auto w-full"
            />
          </Laptop>

          <Phone className="absolute bottom-0 start-0 w-[30%] max-w-[250px] sm:w-[25%]">
            <Image
              src={`/images/product/hero-phone-${lang}.webp`}
              alt={home.heroPhoneAlt}
              width={780}
              height={1688}
              priority
              sizes="(min-width: 1100px) 250px, 25vw"
              className="block h-auto w-full"
            />
          </Phone>

          {/* How long it takes, said once and plainly, on the window's top corner. */}
          <p className="absolute -top-4 end-[4%] inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-card ring-4 ring-background sm:-top-5 sm:text-base">
            <Timer className="h-4 w-4" />
            {home.heroChipReady}
          </p>
        </div>
      </Container>
    </section>
  );
}
