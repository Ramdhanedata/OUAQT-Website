import type { Pack } from "@/app-ui/packs";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import type { Dictionary } from "@/lib/i18n";
import { localeHref, type Locale } from "@/lib/i18n/config";
import { localisedHref } from "@/lib/i18n/routes";
import { ArrowRight } from "lucide-react";
import { LiveDemo } from "./live-demo";

/*
 * The Builder, which is the product: what it is, the three steps, and then
 * the software itself, running, for the visitor to try.
 */
export function BuilderProduct({
  dict,
  lang,
  demoPacks,
}: {
  dict: Dictionary;
  lang: Locale;
  demoPacks: Pack[];
}) {
  const home = dict.builderHome;
  const steps = [
    { title: home.builderStep1, body: home.builderStep1Body },
    { title: home.builderStep2, body: home.builderStep2Body },
    { title: home.builderStep3, body: home.builderStep3Body },
  ];

  return (
    <section id="builder" className="scroll-mt-20 py-20 sm:py-28">
      <Container>
        <FadeIn className="grid gap-8 lg:grid-cols-2 lg:items-end lg:gap-16">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{home.builderEyebrow}</p>
            <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {home.builderHeading}
            </h2>
          </div>
          <div>
            <p className="text-lg leading-relaxed text-muted-foreground">{home.builderBody}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Button href={localisedHref(lang, "builder")} variant="primary" className="min-h-[48px] text-base">
                {home.builderCta}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
              <a
                href={localeHref(lang, "/pricing")}
                className="inline-flex min-h-[48px] items-center text-base text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
              >
                {home.builderPricing}
              </a>
            </div>
          </div>
        </FadeIn>

        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((step, index) => (
            <li key={step.title}>
              <FadeIn delay={index * 0.06} className="border-t border-border pt-6">
                <span className="text-sm font-medium tabular-nums text-app-gold-ink">0{index + 1}</span>
                <h3 className="mt-3 text-xl font-medium text-foreground">{step.title}</h3>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">{step.body}</p>
              </FadeIn>
            </li>
          ))}
        </ol>

        <div id="demo" className="scroll-mt-24 pt-20 sm:pt-24">
          <FadeIn className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-accent">
              <span className="h-2 w-2 rounded-full bg-app-success" />
              {home.demoEyebrow}
            </p>
            <h3 className="mt-5 text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {home.demoHeading}
            </h3>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{home.demoBody}</p>
          </FadeIn>

          <div className="mt-10">
            <LiveDemo
              lang={lang}
              packs={demoPacks}
              labels={dict.packLabels}
              shops={home.demoShops}
              loading={home.demoLoading}
              note={home.demoNote}
              phone={home.demoPhone}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
