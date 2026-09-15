import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { pricingTerms } from "@/lib/data/pricing";
import type { Dictionary } from "@/lib/i18n";
import { localeHref, type Locale } from "@/lib/i18n/config";
import { fill } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

/* Built-to-order systems. Quoted on days of work, so no figure is printed. */
export function Bespoke({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const b = dict.pricingPage.bespoke;

  return (
    <Section className="border-t border-border py-16 sm:py-20">
      <Container>
        <FadeIn className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
            {b.eyebrow}
          </p>
          <h2 className="mt-5 text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {b.heading}
          </h2>
          <p className="mt-5 leading-relaxed text-muted-foreground">{b.body}</p>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {fill(b.maintenance, pricingTerms(lang))}
          </p>
          <div className="mt-7">
            <Button href={localeHref(lang, "/contact")} variant="primary">
              {b.cta}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </div>
        </FadeIn>
      </Container>
    </Section>
  );
}
