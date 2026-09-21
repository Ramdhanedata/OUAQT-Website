import { LegalPage } from "@/components/legal/legal-page";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { alternatesFor } from "@/lib/i18n/metadata";
import { getPublicSettings } from "@/builder/db/settings";
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

/*
 * Two agreements in one document, because an owner should not have to work
 * out which page applies to him. Part one is the software he builds himself,
 * part two is a project we install, part three covers both.
 *
 * The trial, the grace period and the device count are read from settings, so
 * the page always states the rule the software actually enforces.
 */
export default async function TermsPage({ params }: Props) {
  const dict = getDictionary(params.lang);
  const t = dict.legal.terms;
  const settings = await getPublicSettings();
  const values = {
    ...pricingTerms(params.lang),
    trialDays: settings?.trial_days ?? "",
    graceDays: settings?.renewal_grace_days ?? "",
    devices: settings?.max_devices ?? pricingTerms(params.lang).devices,
  };

  return (
    <LegalPage
      title={t.title}
      intro={t.intro}
      updatedLabel={dict.legal.updated}
      updatedDate={dict.legal.updatedDate}
      sections={(
        [
          { ...t.selfServePart, part: true },
          t.trial,
          t.selfLicence,
          t.payment,
          t.grace,
          t.devices,
          t.selfData,
          t.selfSupport,
          t.selfChanges,
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
        ] as { h: string; b: string; items?: string[]; part?: boolean }[]
      ).map((section) => ({
        h: section.h,
        b: fill(section.b, values),
        items: section.items?.map((item) => fill(item, values)),
        part: section.part,
      }))}
    />
  );
}
