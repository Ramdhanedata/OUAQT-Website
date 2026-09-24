import { describe, expect, it } from "vitest";
import { plural } from "./utils";
import { getBuilderCopy } from "@/builder/copy";

/*
 * "1 lignes à corriger" is small and it is the kind of small that makes an
 * owner trust the software a little less. Arabic is stricter than French:
 * it has a form for one, a form for two, and others again beyond.
 */
describe("a sentence that counts", () => {
  it("agrees in French", () => {
    const copy = getBuilderCopy("fr");
    expect(plural("fr", 1, copy.products.toFix)).toBe("1 ligne à corriger.");
    expect(plural("fr", 7, copy.products.toFix)).toBe("7 lignes à corriger.");
    expect(plural("fr", 0, copy.products.ready)).toBe("0 produit prêt.");
  });

  it("agrees in English", () => {
    const copy = getBuilderCopy("en");
    expect(plural("en", 1, copy.products.ready)).toBe("1 product ready.");
    expect(plural("en", 412, copy.products.ready)).toBe("412 products ready.");
  });

  it("uses the right Arabic form for one, two and a few", () => {
    const copy = getBuilderCopy("ar");
    expect(plural("ar", 0, copy.products.toFix)).toBe("لا أسطر بحاجة إلى تصحيح.");
    expect(plural("ar", 1, copy.products.toFix)).toBe("سطر واحد بحاجة إلى تصحيح.");
    expect(plural("ar", 2, copy.products.toFix)).toBe("سطران بحاجة إلى تصحيح.");
    expect(plural("ar", 3, copy.products.toFix)).toContain("أسطر");
    expect(plural("ar", 11, copy.products.toFix)).toContain("سطراً");
  });

  it("falls back to the general form when a language has no such category", () => {
    expect(plural("fr", 2, { other: "{count} choses" })).toBe("2 choses");
  });
});
