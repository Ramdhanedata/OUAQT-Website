import { describe, expect, it } from "vitest";
// How Next.js itself matches a header rule's source against a path.
import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import sitemap from "@/app/sitemap";
import { packs } from "@/app-ui/packs";
import { locales } from "@/lib/i18n/config";
import { alternatesFor, localisedAlternatesFor, siteUrl } from "@/lib/i18n/metadata";
import { localisedRoutes } from "@/lib/i18n/routes";
import { breadcrumbData } from "@/lib/seo/breadcrumbs";
import { softwareOffer } from "@/lib/seo/software-application";
import { getDictionary } from "@/lib/i18n";
import { getPackPage } from "@/lib/i18n/packs";
import nextConfig from "@/next.config.mjs";

/*
 * What Google Search Console reads: each page's canonical and translations,
 * the sitemap, and which addresses say noindex. A page meant for a search
 * result must point at itself and list its three languages and x-default; a
 * page for owners only must say noindex, and never be in the sitemap.
 */

describe("canonical and translations", () => {
  it("points every page at itself, with its three languages and French as x-default", () => {
    for (const lang of locales) {
      expect(alternatesFor(lang, "/")).toEqual({
        canonical: `/${lang}`,
        languages: { en: "/en", fr: "/fr", ar: "/ar", "x-default": "/fr" },
      });
      expect(alternatesFor(lang, "/pricing").canonical).toBe(`/${lang}/pricing`);
      expect(alternatesFor(lang, "/pricing").languages["x-default"]).toBe("/fr/pricing");
    }
  });

  it("does the same for pages whose address is a different word in each language", () => {
    expect(localisedAlternatesFor("ar", "pack-pharmacy")).toEqual({
      canonical: "/ar/pharmacy-management-software",
      languages: {
        en: "/en/pharmacy-management-software",
        fr: "/fr/logiciel-gestion-pharmacie",
        ar: "/ar/pharmacy-management-software",
        "x-default": "/fr/logiciel-gestion-pharmacie",
      },
    });
  });
});

describe("sitemap", () => {
  const entries = sitemap();
  const base = siteUrl();
  const urls = entries.map((entry) => entry.url);

  it("lists each page once in each language", () => {
    expect(new Set(urls).size).toBe(urls.length);
    // Home, nine trades, the builder, pricing, projects, about, contact,
    // six case studies, terms and privacy: 23 pages, three languages each.
    expect(urls).toHaveLength(3 * (1 + packs.length + 1 + 4 + 6 + 2));
    expect(urls).toContain(`${base}/fr`);
    expect(urls).toContain(`${base}/fr/logiciel-gestion-pharmacie`);
    expect(urls).toContain(`${base}/ar/build-my-software`);
  });

  it("gives every entry its three languages and x-default, all of them in the sitemap too", () => {
    for (const entry of entries) {
      const languages = entry.alternates?.languages as Record<string, string>;
      expect(Object.keys(languages).sort()).toEqual(["ar", "en", "fr", "x-default"]);
      for (const href of Object.values(languages)) expect(urls).toContain(href);
    }
  });

  it("leaves out the pages for owners and staff, and every address with a query", () => {
    const privateSlugs = [
      ...Object.values(localisedRoutes.account),
      ...Object.values(localisedRoutes.pay),
    ];
    for (const url of urls) {
      const [, , slug] = new URL(url).pathname.split("/");
      expect(privateSlugs).not.toContain(slug);
      expect(url).not.toMatch(/\?|\/app|\/admin|\/api/);
    }
  });
});

describe("noindex in the response", () => {
  it("covers the phone app, the admin area, and the account and payment pages in every language", async () => {
    const rules = await nextConfig.headers!();
    const noindex = rules.filter((rule) =>
      rule.headers.some((h) => h.key === "X-Robots-Tag" && h.value.includes("noindex"))
    );
    const matches = (path: string) =>
      noindex.some((rule) => getPathMatch(rule.source, { strict: true })(path) !== false);

    for (const lang of locales) {
      for (const id of ["account", "pay"] as const) {
        for (const slug of Object.values(localisedRoutes[id])) {
          expect(matches(`/${lang}/${slug}`), `/${lang}/${slug}`).toBe(true);
        }
      }
    }
    expect(matches("/app/index.html")).toBe(true);
    expect(matches("/app-preview/index.html")).toBe(true);
    expect(matches("/admin/clients")).toBe(true);

    // And nothing meant for a search result.
    for (const url of sitemap().map((entry) => new URL(entry.url).pathname)) {
      expect(matches(url), url).toBe(false);
    }
    expect(matches("/apple-icon.png")).toBe(false);
  });
});

describe("structured data", () => {
  it("prices the software in ouguiyas, a month at a time, when no settings can be read", () => {
    const { offers } = softwareOffer("fr", null) as { offers: { price: number; priceCurrency: string; url: string } };
    expect(offers.priceCurrency).toBe("MRU");
    expect(offers.price).toBeGreaterThan(0);
    expect(offers.url).toBe(`${siteUrl()}/fr/pricing`);
  });

  it("starts every breadcrumb at the home page in the page's language", () => {
    const data = breadcrumbData("ar", getDictionary("ar"), [{ name: "x", path: "/ar/pricing" }]);
    expect(data.itemListElement.map((item) => [item.position, item.item])).toEqual([
      [1, `${siteUrl()}/ar`],
      [2, `${siteUrl()}/ar/pricing`],
    ]);
  });

  it("names every trade page in every language for the links between them", () => {
    for (const lang of locales) {
      const links = getPackPage(lang, "pharmacy").common.links;
      for (const pack of packs) expect(links[pack], `${lang} ${pack}`).toBeTruthy();
    }
  });
});
