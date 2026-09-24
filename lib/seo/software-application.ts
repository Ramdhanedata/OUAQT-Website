import type { Dictionary, Locale } from "@/lib/i18n";
import { siteUrl } from "@/lib/i18n/metadata";
import { localisedHref } from "@/lib/i18n/routes";

/*
 * The desktop software an owner ends up with, described for search engines.
 *
 * No `offers` block. A price in the markup that contradicts "price not yet
 * set" on the page is worse than no price at all, so it goes in when the
 * settings row goes in, and not before.
 */
export function softwareApplicationData(lang: Locale, dict: Dictionary) {
  const base = siteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${base}/${lang}#software`,
    name: dict.common.brand,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Windows",
    description: dict.meta.siteDescription,
    url: `${base}${localisedHref(lang, "builder")}`,
    inLanguage: ["fr", "ar", "en"],
    publisher: { "@id": `${base}/#business` },
  };
}
