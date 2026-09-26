import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { FadeIn } from "@/components/motion/fade-in";
import { Faq } from "@/components/home/faq";
import { PriceBook } from "@/components/pricing/price-book";
import { Bespoke } from "@/components/pricing/bespoke";
import { Perpetual } from "@/components/pricing/perpetual";
import { Coverage } from "@/components/pricing/coverage";
import { BuilderPrices } from "@/components/pricing/builder-prices";
import { getPublicSettings } from "@/builder/db/settings";
import { getLaunchOffer } from "@/builder/payment/launch";
import { pricingTerms } from "@/lib/data/pricing";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { alternatesFor } from "@/lib/i18n/metadata";
import { fill } from "@/lib/utils";
import type { Metadata } from "next";

type Props = { params: Promise<{ lang: Locale }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const dict = getDictionary(params.lang);
  return {
    title: dict.meta.pricingTitle,
    description: dict.meta.pricingDescription,
    alternates: alternatesFor(params.lang, "/pricing"),
  };
}

/*
 * Two tracks, in the order an owner meets them: the software he builds
 * himself, which is the main offer, and below it the one we come and install.
 *
 * The first block's figures come from the settings table and the second's
 * from the price book, because one is a product he buys today and the other
 * is a quotation for work. A price nobody has set yet says so.
 */
export default async function PricingPage(props: Props) {
  const params = await props.params;
  const dict = getDictionary(params.lang);
  const p = dict.pricingPage;
  const terms = pricingTerms(params.lang);
  const settings = await getPublicSettings();
  const offer = await getLaunchOffer();

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

      <BuilderPrices
        dict={dict}
        lang={params.lang}
        settings={settings}
        offer={offer}
      />

      <Section className="pb-0 sm:pb-0">
        <Container>
          <FadeIn>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
              {p.customTrack.eyebrow}
            </p>
            <h2 className="mt-4 max-w-3xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {p.customTrack.heading}
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
              {p.customTrack.intro}
            </p>
            <p className="mt-4 max-w-2xl text-sm font-medium text-foreground">
              {p.freeVisit}
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
