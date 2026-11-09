import type { Dictionary } from "@/lib/i18n";
import { localeHref, type Locale } from "@/lib/i18n/config";
import { siteUrl } from "@/lib/i18n/metadata";

/*
 * Where a page sits under the home page, for search engines, which show it
 * in place of the bare address under a result ("OUAQT › Tarifs").
 *
 * `trail` is everything after the home page, each step with the address of
 * its page in this language.
 */
export function breadcrumbData(
  lang: Locale,
  dict: Dictionary,
  trail: { name: string; path: string }[]
) {
  const base = siteUrl();
  const steps = [{ name: dict.common.brand, path: localeHref(lang, "/") }, ...trail];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: steps.map((step, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: step.name,
      item: `${base}${step.path}`,
    })),
  };
}
