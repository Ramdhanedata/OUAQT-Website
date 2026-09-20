import type { MetadataRoute } from "next";
import { projects } from "@/lib/data/projects";
import { locales } from "@/lib/i18n/config";
import { siteUrl } from "@/lib/i18n/metadata";
import { localisedHref } from "@/lib/i18n/routes";

/*
 * Lists every localised page so search engines can find all of them, and
 * declares the language alternates for each so they are understood as
 * translations rather than duplicates.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const paths = [
    { path: "", priority: 1 },
    { path: "/projects", priority: 0.9 },
    { path: "/pricing", priority: 0.8 },
    { path: "/about", priority: 0.8 },
    { path: "/contact", priority: 0.8 },
    ...projects.map((p) => ({ path: `/projects/${p.slug}`, priority: 0.7 })),
    { path: "/terms", priority: 0.3 },
    { path: "/privacy", priority: 0.3 },
  ];

  /*
   * The builder is not in the list above because its address is a different
   * word in each language. Same page, three URLs, declared as translations of
   * each other so they are not read as three competing pages.
   */
  const builder = locales.map((lang) => ({
    url: `${base}${localisedHref(lang, "builder")}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.9,
    alternates: {
      languages: Object.fromEntries(
        locales.map((l) => [l, `${base}${localisedHref(l, "builder")}`])
      ),
    },
  }));

  const pages = locales.flatMap((lang) =>
    paths.map(({ path, priority }) => ({
      url: `${base}/${lang}${path}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${base}/${l}${path}`])
        ),
      },
    }))
  );

  return [...builder, ...pages];
}
