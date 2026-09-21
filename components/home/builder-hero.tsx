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
 * The first thing anyone sees, and the whole offer in two sentences: you
 * describe your shop, you leave with your software.
 *
 * The reassurance line names the trial length from settings. When settings
 * cannot be read it says the two things that are true regardless rather than
 * inventing a number of days.
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

  return (
    <section className="relative overflow-hidden">
      <GradientMesh />
      <Container className="flex min-h-[80vh] flex-col justify-center py-24 sm:py-32">
        <h1
          className="hero-enter max-w-4xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-6xl md:text-7xl"
        >
          {home.heroHeading}
        </h1>

        <p
          style={rise(0.12)}
          className="hero-enter mt-8 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground"
        >
          {home.heroBody}
        </p>

        <div
          style={rise(0.22)}
          className="hero-enter mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
        >
          <Button href={localisedHref(lang, "builder")} variant="accent">
            {home.heroPrimary}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
          <a
            href="#sur-mesure"
            className="inline-flex min-h-[48px] items-center text-base text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
          >
            {home.heroSecondary}
          </a>
        </div>

        <p style={rise(0.3)} className="hero-enter mt-8 text-base text-muted-foreground">
          {trialDays
            ? fill(home.heroReassurance, { days: trialDays })
            : home.heroReassuranceNoTrial}
        </p>
      </Container>
    </section>
  );
}
