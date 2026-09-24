import { describe, expect, it } from "vitest";
import { locales } from "./config";
import { withLocale } from "./config";
import { localisedHref, localisedRoutes, routeIdForSlug, translateSlug } from "./routes";

describe("localised routes", () => {
  it("gives every route a slug in every language", () => {
    for (const [id, slugs] of Object.entries(localisedRoutes)) {
      for (const locale of locales) {
        expect(slugs[locale], `${id} in ${locale}`).toBeTruthy();
      }
    }
  });

  it("finds the route behind a slug written in any language", () => {
    expect(routeIdForSlug("creer-mon-logiciel")).toBe("builder");
    expect(routeIdForSlug("build-my-software")).toBe("builder");
    expect(routeIdForSlug("projects")).toBeNull();
  });

  it("builds the public path for a language", () => {
    expect(localisedHref("fr", "builder")).toBe("/fr/creer-mon-logiciel");
    expect(localisedHref("en", "builder")).toBe("/en/build-my-software");
    expect(localisedHref("fr", "account", "/paiement")).toBe("/fr/compte/paiement");
  });

  it("translates a slug into another language", () => {
    expect(translateSlug("creer-mon-logiciel", "en")).toBe("build-my-software");
    expect(translateSlug("projects", "ar")).toBeNull();
  });
});

describe("language switcher", () => {
  it("translates the slug when switching language on the builder", () => {
    expect(withLocale("/fr/creer-mon-logiciel", "en")).toBe("/en/build-my-software");
    expect(withLocale("/en/build-my-software", "fr")).toBe("/fr/creer-mon-logiciel");
  });

  it("leaves marketing pages exactly as they are", () => {
    expect(withLocale("/fr/projects/gmm-mining", "ar")).toBe("/ar/projects/gmm-mining");
    expect(withLocale("/en/pricing", "fr")).toBe("/fr/pricing");
    expect(withLocale("/ar", "en")).toBe("/en");
  });
});
