import type { MetadataRoute } from "next";
import { projects } from "@/lib/data/projects";
import { locales } from "@/lib/i18n/config";
import { siteUrl } from "@/lib/i18n/metadata";

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
    { path: "/about", priority: 0.8 },
    { path: "/contact", priority: 0.8 },
    ...projects.map((p) => ({ path: `/projects/${p.slug}`, priority: 0.7 })),
    { path: "/terms", priority: 0.3 },
    { path: "/privacy", priority: 0.3 },
  ];

  return locales.flatMap((lang) =>
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
}
