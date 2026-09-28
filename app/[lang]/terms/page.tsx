import { LegalPage } from "@/components/legal/legal-page";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { alternatesFor } from "@/lib/i18n/metadata";
import { getPublicSettings } from "@/builder/db/settings";
import { builderTerms, pricingTerms } from "@/lib/data/pricing";
import { fill } from "@/lib/utils";
import type { Metadata } from "next";

type Props = { params: Promise<{ lang: Locale }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const dict = getDictionary(params.lang);
  return {
    title: dict.meta.termsTitle,
    description: dict.meta.termsDescription,
    alternates: alternatesFor(params.lang, "/terms"),
  };
}

/*
 * Two agreements in one document, because an owner should not have to work
 * out which page applies to him. Part one is the software he builds himself,
 * part two is a project we install, part three covers both.
 *
 * The trial, the grace period and the device count are read from settings, so
 * the page always states the rule the software actually enforces, with the
 * published figures standing in when settings cannot be read.
 */
export default async function TermsPage(props: Props) {
  const params = await props.params;
  const dict = getDictionary(params.lang);
  const t = dict.legal.terms;
  const settings = await getPublicSettings();
  const builder = builderTerms(settings);
  const values = {
    ...pricingTerms(params.lang),
    trialDays: builder.trialDays,
    graceDays: builder.graceDays,
  };
  /* Part one is the builder licence, part two a project we install: each states its own device count. */
  const selfServe = { ...values, devices: builder.devices };

  return (
    <LegalPage
      title={t.title}
      intro={t.intro}
      updatedLabel={dict.legal.updated}
      updatedDate={dict.legal.updatedDate}
      sections={(
        [
          { ...t.selfServePart, part: true },
          { ...t.trial, self: true },
          { ...t.selfLicence, self: true },
          { ...t.payment, self: true },
          { ...t.grace, self: true },
          { ...t.devices, self: true },
          { ...t.selfData, self: true },
          { ...t.selfSupport, self: true },
          { ...t.selfChanges, self: true },
          { ...t.bespokePart, part: true },
          t.licence,
          t.corrections,
          t.support,
          t.yourData,
          t.termination,
          { ...t.commonPart, part: true },
          t.ownership,
          t.restrictions,
          t.law,
        ] as { h: string; b: string; items?: string[]; part?: boolean; self?: boolean }[]
      ).map((section) => {
        const terms = section.self ? selfServe : values;
        return {
          h: section.h,
          b: fill(section.b, terms),
          items: section.items?.map((item) => fill(item, terms)),
          part: section.part,
        };
      })}
    />
  );
}
