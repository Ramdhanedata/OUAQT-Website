import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { Price } from "@/components/pricing/price";
import { pricing, pricingTerms, yearOne } from "@/lib/data/pricing";
import type { Dictionary } from "@/lib/i18n";
import { localeHref, type Locale } from "@/lib/i18n/config";
import { fill } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

/*
 * A pointer to the pricing page rather than a second price table. It shows
 * only the year-one total, the figure a buyer compares, read from the same
 * price book as the pricing page.
 */
export function Pricing({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const p = dict.pricing;

  return (
    <Section className="border-t border-border bg-muted/40">
      <Container>
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-5 lg:gap-14">
          <FadeIn className="lg:col-span-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
              {p.eyebrow}
            </p>
            <h2 className="mt-6 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {p.heading}
            </h2>
            <p className="mt-6 max-w-xl text-balance text-lg leading-relaxed text-muted-foreground">
              {p.body}
            </p>
          </FadeIn>

          <FadeIn delay={0.1} className="lg:col-span-2">
            <div className="rounded-2xl border border-border bg-surface p-8">
              <p className="text-sm text-muted-foreground">{p.yearOneLabel}</p>
              <div className="mt-3">
                <Price
                  line={yearOne}
                  lang={lang}
                  labels={{
                    standard: dict.pricingPage.standardLabel,
                    launch: dict.pricingPage.launchLabel,
                  }}
                  size="lg"
                />
              </div>
              {pricing.launchOffer.active ? (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {fill(p.launchNote, pricingTerms(lang))}
                </p>
              ) : null}
              <div className="mt-7">
                <Button
                  href={localeHref(lang, "/pricing")}
                  variant="accent"
                  className="w-full justify-center"
                >
                  {p.cta}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>
      </Container>
    </Section>
  );
}
