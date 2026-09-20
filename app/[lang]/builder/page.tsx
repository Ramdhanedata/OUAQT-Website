import { Builder } from "@/builder/ui/builder";
import { getBuilderCopy } from "@/builder/copy";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { localisedHref } from "@/lib/i18n/routes";
import { locales } from "@/lib/i18n/config";
import type { Metadata } from "next";

type Props = { params: { lang: Locale } };

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export function generateMetadata({ params }: Props): Metadata {
  const copy = getBuilderCopy(params.lang);
  const dict = getDictionary(params.lang);
  return {
    title: `${copy.landing.title} | ${dict.common.brand}`,
    description: copy.landing.intro,
    alternates: {
      canonical: localisedHref(params.lang, "builder"),
      languages: Object.fromEntries(
        locales.map((locale) => [locale, localisedHref(locale, "builder")])
      ) as Record<Locale, string>,
    },
  };
}

export default function BuilderPage({ params }: Props) {
  return <Builder copy={getBuilderCopy(params.lang)} locale={params.lang} />;
}
