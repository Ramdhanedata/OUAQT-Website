import type { MetadataRoute } from "next";
import { projects } from "@/lib/data/projects";
import { locales } from "@/lib/i18n/config";
import { alternatesFor, localisedAlternatesFor, siteUrl } from "@/lib/i18n/metadata";
import { packs } from "@/app-ui/packs";
import { packRouteId, type LocalisedRouteId } from "@/lib/i18n/routes";

/*
 * Every page meant for a search result, in its three languages, and nothing
 * else: no page that redirects, none marked noindex (the account, the payment
 * page, the phone app, the admin area), no address with a query string.
 *
 * Each entry carries the same canonical and translations as the page's own
 * <head>, x-default included, because both come from lib/i18n/metadata.ts:
 * a sitemap that disagrees with the page is one Google stops trusting.
 *
 * No lastModified: stamping every page with the time of the request tells
 * Google the dates are meaningless, and it then ignores them for good.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();

  type Alternates = { canonical: string; languages: Record<string, string> };
  const entries = (of: (lang: (typeof locales)[number]) => Alternates, priority: number) =>
    locales.map((lang) => {
      const { canonical, languages } = of(lang);
      return {
        url: `${base}${canonical}`,
        changeFrequency: "monthly" as const,
        priority,
        alternates: {
          languages: Object.fromEntries(
            Object.entries(languages).map(([l, href]) => [l, `${base}${href}`])
          ),
        },
      };
    });

  const page = (path: string, priority: number) =>
    entries((lang) => alternatesFor(lang, path), priority);
  const localised = (id: LocalisedRouteId, priority: number) =>
    entries((lang) => localisedAlternatesFor(lang, id), priority);

  return [
    ...page("/", 1),
    // One page per trade, the addresses an owner reaches from a search.
    ...packs.flatMap((pack) => localised(packRouteId(pack), 0.9)),
    ...localised("builder", 0.9),
    ...page("/pricing", 0.8),
    ...page("/projects", 0.7),
    ...page("/about", 0.6),
    ...page("/contact", 0.6),
    ...projects.flatMap((p) => page(`/projects/${p.slug}`, 0.5)),
    ...page("/terms", 0.3),
    ...page("/privacy", 0.3),
  ];
}
