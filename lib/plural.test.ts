import { describe, expect, it } from "vitest";
import { plural } from "./utils";
import { getBuilderCopy } from "@/builder/copy";

/*
 * "1 jours restants" is small and it is the kind of small that makes an
 * owner trust the software a little less. Arabic is stricter than French:
 * it has a form for one, a form for two, and others again beyond.
 */
describe("a sentence that counts", () => {
  it("agrees in French", () => {
    const copy = getBuilderCopy("fr");
    expect(plural("fr", 1, copy.licence.trial)).toBe("Essai gratuit, 1 jour restant.");
    expect(plural("fr", 7, copy.licence.trial)).toBe("Essai gratuit, 7 jours restants.");
    expect(plural("fr", 0, copy.licence.trial)).toBe("Essai gratuit, 0 jour restant.");
  });

  it("agrees in English", () => {
    const copy = getBuilderCopy("en");
    expect(plural("en", 1, copy.licence.trial)).toBe("Free trial, 1 day left.");
    expect(plural("en", 30, copy.licence.trial)).toBe("Free trial, 30 days left.");
  });

  it("uses the right Arabic form for one, two and a few", () => {
    const copy = getBuilderCopy("ar");
    expect(plural("ar", 0, copy.licence.trial)).toBe("انتهت فترة التجربة.");
    expect(plural("ar", 1, copy.licence.trial)).toBe("تجربة مجانية، بقي يوم واحد.");
    expect(plural("ar", 2, copy.licence.trial)).toBe("تجربة مجانية، بقي يومان.");
    expect(plural("ar", 3, copy.licence.trial)).toContain("أيام");
    expect(plural("ar", 11, copy.licence.trial)).toContain("يوماً");
  });

  it("falls back to the general form when a language has no such category", () => {
    expect(plural("fr", 2, { other: "{count} choses" })).toBe("2 choses");
  });
});
