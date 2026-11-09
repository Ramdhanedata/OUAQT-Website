import { toMajor } from "@/app-ui/money";
import type { PublicSettings } from "@/builder/db/settings";
import { shownPrice } from "@/lib/data/pricing";
import type { Dictionary, Locale } from "@/lib/i18n";
import { localeHref } from "@/lib/i18n/config";
import { siteUrl } from "@/lib/i18n/metadata";
import { localisedHref } from "@/lib/i18n/routes";

/*
 * The software an owner ends up with, described for search engines: on the
 * home page for OUAQT as a whole, and on each trade page for that trade.
 *
 * It runs on a Windows or Mac computer and opens on an Android phone or an
 * iPhone (the phone app under /app).
 */
export const operatingSystems = "Windows, macOS, Android, iOS";

export function softwareApplicationData(
  lang: Locale,
  dict: Dictionary,
  settings: PublicSettings | null
) {
  const base = siteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${base}/${lang}#software`,
    name: dict.common.brand,
    applicationCategory: "BusinessApplication",
    operatingSystem: operatingSystems,
    description: dict.meta.siteDescription,
    url: `${base}${localisedHref(lang, "builder")}`,
    inLanguage: ["fr", "ar", "en"],
    publisher: { "@id": `${base}/#business` },
    ...softwareOffer(lang, settings),
  };
}

/*
 * What it costs, as the pricing page shows it: the monthly licence in
 * ouguiyas, the smallest commitment an owner can make. The figure comes from
 * the same place as the page's own (settings, or the decided list when they
 * cannot be read), so the markup never says a price the page does not.
 * Nothing at all when no monthly price is set.
 */
export function softwareOffer(lang: Locale, settings: PublicSettings | null) {
  const monthly = shownPrice("monthly", settings, false);
  if (monthly.amount === null) return {};
  const price = toMajor(monthly.amount);

  return {
    offers: {
      "@type": "Offer",
      url: `${siteUrl()}${localeHref(lang, "/pricing")}`,
      price,
      priceCurrency: "MRU",
      availability: "https://schema.org/InStock",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price,
        priceCurrency: "MRU",
        referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
      },
      areaServed: { "@type": "Country", name: "Mauritania" },
    },
  };
}
