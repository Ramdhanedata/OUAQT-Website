import type { Metadata } from "next";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { siteUrl } from "@/lib/i18n/metadata";

/*
 * The Open Graph locale for each language, in the language_TERRITORY form
 * Facebook and WhatsApp expect. The territory is Mauritania, where OUAQT
 * sells; English has no Mauritanian variant in common use.
 */
export const ogLocales: Record<Locale, string> = {
  fr: "fr_MR",
  ar: "ar_MR",
  en: "en_US",
};

/*
 * Title, description, canonical and share preview for one page.
 *
 * Next.js does not merge `openGraph` between a layout and a page: a page that
 * sets only a title keeps the layout's whole openGraph block, so every shared
 * link showed the home page's title and address. Each page builds its own
 * here instead.
 */
export function pageMetadata(
  lang: Locale,
  dict: Dictionary,
  page: {
    title: string;
    description: string;
    alternates: { canonical: string; languages?: Record<string, string> };
  }
): Metadata {
  const url = `${siteUrl()}${page.alternates.canonical}`;
  const image = { url: `/og/${lang}.png`, width: 1200, height: 630, alt: dict.meta.shareAlt };
  return {
    title: page.title,
    description: page.description,
    alternates: page.alternates,
    openGraph: {
      title: page.title,
      description: page.description,
      url,
      siteName: dict.common.brand,
      locale: ogLocales[lang],
      alternateLocale: Object.entries(ogLocales)
        .filter(([l]) => l !== lang)
        .map(([, og]) => og),
      type: "website",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [image.url],
    },
  };
}
