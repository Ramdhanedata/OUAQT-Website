import { LegalPage } from "@/components/legal/legal-page";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { alternatesFor } from "@/lib/i18n/metadata";
import { pricingTerms } from "@/lib/data/pricing";
import { fill } from "@/lib/utils";
import type { Metadata } from "next";

type Props = { params: { lang: Locale } };

export function generateMetadata({ params }: Props): Metadata {
  const dict = getDictionary(params.lang);
  return {
    title: dict.meta.termsTitle,
    description: dict.meta.termsDescription,
    alternates: alternatesFor(params.lang, "/terms"),
  };
}

export default function TermsPage({ params }: Props) {
  const dict = getDictionary(params.lang);
  const t = dict.legal.terms;
  // Device counts and service months come from the price book, not the copy.
  const values = pricingTerms(params.lang);

  return (
    <LegalPage
      title={t.title}
      intro={t.intro}
      updatedLabel={dict.legal.updated}
      updatedDate={dict.legal.updatedDate}
      sections={(
        [
          t.ownership,
          t.licence,
          t.restrictions,
          t.yourData,
          t.corrections,
          t.support,
          t.termination,
          t.law,
        ] as { h: string; b: string; items?: string[] }[]
      ).map((section) => ({
        h: section.h,
        b: fill(section.b, values),
        items: section.items?.map((item) => fill(item, values)),
      }))}
    />
  );
}
