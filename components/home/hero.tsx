import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { GradientMesh } from "@/components/motion/gradient-mesh";
import type { Dictionary } from "@/lib/i18n";
import { localeHref, type Locale } from "@/lib/i18n/config";
import { ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";

/* Each line rises in a moment after the one above (see .hero-enter in globals.css). */
const rise = (seconds: number) => ({ "--rise-delay": `${seconds}s` }) as CSSProperties;

export function Hero({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  return (
    <section className="relative overflow-hidden">
      <GradientMesh />
      <Container className="flex min-h-[85vh] flex-col justify-center py-24 sm:py-32">
        <p className="hero-enter text-sm font-medium tracking-tight text-accent">
          {dict.hero.eyebrow}
        </p>

        <h1
          style={rise(0.05)}
          className="hero-enter mt-6 max-w-4xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-6xl md:text-7xl"
        >
          {dict.hero.heading}
        </h1>

        <p
          style={rise(0.15)}
          className="hero-enter mt-8 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground"
        >
          {dict.hero.body}
        </p>

        <div
          style={rise(0.25)}
          className="hero-enter mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
        >
          <Button href={localeHref(lang, "/contact")} variant="accent">
            {dict.hero.primaryCta}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
          <Button href={localeHref(lang, "/projects")} variant="outline">
            {dict.hero.secondaryCta}
          </Button>
        </div>

        <p
          style={rise(0.35)}
          className="hero-enter mt-5 text-sm text-muted-foreground"
        >
          {dict.hero.freeVisit}
        </p>
      </Container>
    </section>
  );
}
