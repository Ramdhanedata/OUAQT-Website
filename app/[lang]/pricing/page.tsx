import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { FadeIn } from "@/components/motion/fade-in";
import { Faq } from "@/components/home/faq";
import { PriceBook } from "@/components/pricing/price-book";
import { Bespoke } from "@/components/pricing/bespoke";
import { Perpetual } from "@/components/pricing/perpetual";
import { Coverage } from "@/components/pricing/coverage";
import { pricingTerms } from "@/lib/data/pricing";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { alternatesFor } from "@/lib/i18n/metadata";
import { fill } from "@/lib/utils";
import type { Metadata } from "next";

type Props = { params: { lang: Locale } };

export function generateMetadata({ params }: Props): Metadata {
  const dict = getDictionary(params.lang);
  return {
    title: dict.meta.pricingTitle,
    description: dict.meta.pricingDescription,
    alternates: alternatesFor(params.lang, "/pricing"),
  };
}

/*
 * Order follows the brief: the price everyone pays, the products it covers,
 * bespoke work, then the perpetual option set below the annual licence so it
 * never reads as the default, then scope and questions.
 */
export default function PricingPage({ params }: Props) {
  const dict = getDictionary(params.lang);
  const p = dict.pricingPage;
  const terms = pricingTerms(params.lang);

  return (
    <>
      <Section className="pb-12 pt-32 sm:pb-16 sm:pt-40">
        <Container>
          <FadeIn>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
              {p.eyebrow}
            </p>
            <h1 className="mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {p.heading}
            </h1>
            <p className="mt-6 max-w-2xl leading-relaxed text-muted-foreground">
              {p.intro}
            </p>
          </FadeIn>
        </Container>
      </Section>

      <PriceBook dict={dict} lang={params.lang} />
      <Bespoke dict={dict} lang={params.lang} />
      <Perpetual dict={dict} lang={params.lang} />
      <Coverage dict={dict} lang={params.lang} />
      <Faq
        eyebrow={p.faq.eyebrow}
        heading={p.faq.heading}
        items={p.faq.items.map((item) => ({
          q: fill(item.q, terms),
          a: fill(item.a, terms),
        }))}
      />
    </>
  );
}
