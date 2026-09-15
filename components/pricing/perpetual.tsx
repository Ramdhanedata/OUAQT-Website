import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { Price } from "@/components/pricing/price";
import { pricing, pricingTerms } from "@/lib/data/pricing";
import type { Dictionary } from "@/lib/i18n";
import { localeHref, type Locale } from "@/lib/i18n/config";
import { fill } from "@/lib/utils";

/*
 * The perpetual licence. Deliberately placed after the annual licence and set
 * lighter: no card, smaller heading, an understated link. The twelve-month
 * service limit sits directly under the price.
 */
export function Perpetual({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const p = dict.pricingPage;

  return (
    <Section className="border-t border-border py-14 sm:py-16">
      <Container>
        <FadeIn className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {p.perpetual.eyebrow}
          </p>
          <h2 className="mt-4 text-balance text-xl font-medium tracking-tight text-foreground">
            {p.perpetual.heading}
          </h2>
          <div className="mt-5">
            <Price
              line={pricing.perpetualLicence}
              lang={lang}
              labels={{ standard: p.standardLabel, launch: p.launchLabel }}
            />
            <p className="mt-1 text-sm text-muted-foreground">
              {p.perpetual.cadence}
            </p>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {fill(p.perpetual.body, pricingTerms(lang))}
          </p>
          <div className="mt-5">
            <Button
              href={localeHref(lang, "/contact")}
              variant="ghost"
              className="px-0 underline decoration-border underline-offset-4 hover:decoration-accent"
            >
              {p.perpetual.cta}
            </Button>
          </div>
        </FadeIn>
      </Container>
    </Section>
  );
}
