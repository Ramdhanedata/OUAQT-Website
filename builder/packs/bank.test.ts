import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  appLanguages,
  configurationSchema,
  defaultConfiguration,
  packs,
} from "@/app-ui/config";
import { applyAnswers, common, interviewFor, isAsked, packBank } from "./index";
import type { Question } from "./bank";

/*
 * Section 21: the JSON validates, every question exists in all three
 * languages, and every maps_to path is a real place in the configuration.
 *
 * That last one is the test that matters. A path with a typo in it writes a
 * field nobody reads, and the owner's answer disappears without a single
 * error anywhere.
 */

/** Follows a dotted path through a Zod object, through optionals and defaults. */
function resolve(schema: z.ZodTypeAny, path: string): z.ZodTypeAny | null {
  let node: z.ZodTypeAny = schema;

  for (const key of path.split(".")) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const def = node as any;
    while (def._def?.innerType || def.unwrap) {
      const inner = def._def?.innerType ?? def.unwrap?.();
      if (!inner || inner === node) break;
      node = inner;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(node as any)._def?.innerType && !(node as any).unwrap) break;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shape = (node as any).shape ?? (node as any)._def?.shape;
    const resolved = typeof shape === "function" ? shape() : shape;
    if (!resolved || !(key in resolved)) return null;
    node = resolved[key];
  }
  return node;
}

const banks: [string, Question[]][] = [["common", common.questions]];
for (const pack of packs) {
  const bank = packBank(pack);
  if (bank) banks.push([pack, bank.questions]);
}

describe.each(banks)("%s question bank", (_name, questions) => {
  it("has no repeated question id", () => {
    const ids = questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("asks every question in all three languages", () => {
    for (const item of questions) {
      for (const language of appLanguages) {
        expect(item.label[language].trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("writes every answer somewhere the configuration actually has", () => {
    for (const item of questions) {
      for (const rule of item.maps_to) {
        expect(
          resolve(configurationSchema, rule.path),
          `${item.id} writes to ${rule.path}`
        ).not.toBeNull();
      }
    }
  });

  it("only depends on questions that come earlier", () => {
    const seen = new Set<string>();
    for (const item of questions) {
      if (item.show_if) expect(seen.has(item.show_if.question)).toBe(true);
      seen.add(item.id);
    }
  });

  it("gives every choice question a default that is one of its choices", () => {
    for (const item of questions) {
      if (item.type === "single_choice" && item.options) {
        expect(item.options.map((o) => o.id)).toContain(String(item.default));
      }
      if (item.type === "multi_choice") {
        const ids = item.options.map((o) => o.id);
        for (const chosen of item.default) expect(ids).toContain(chosen);
      }
    }
  });
});

describe("an owner who answers nothing", () => {
  it("still gets a valid pharmacy configuration", () => {
    const base = defaultConfiguration("pharmacy", "fr");
    const filled = applyAnswers(
      { ...base, business: { nameLatin: "Test" } },
      interviewFor("pharmacy"),
      {}
    );
    const parsed = configurationSchema.safeParse(filled);
    expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true);
  });

  it("is not asked about a credit limit when he sells nothing on credit", () => {
    const limit = common.questions.find((q) => q.id === "c_credit_limit")!;
    expect(isAsked(limit, { c_credit: false })).toBe(false);
    expect(isAsked(limit, { c_credit: true })).toBe(true);
  });
});

describe("a single answer", () => {
  it("turns the owner's words into the right shape", () => {
    const base = { ...defaultConfiguration("pharmacy", "fr"), business: { nameLatin: "Test" } };
    const filled = applyAnswers(base, interviewFor("pharmacy"), {
      ph_expiry: true,
      ph_expiry_alert: "6",
      c_receipt: "none",
      ph_search: ["name", "barcode"],
    });

    expect(filled.features.pharmacy?.expiryAlertMonths).toBe(6);
    expect(filled.common.printedReceipt).toBe(false);
    expect(filled.features.pharmacy?.search).toEqual(["name", "barcode"]);
    expect(configurationSchema.safeParse(filled).success).toBe(true);
  });

  it("leaves a skipped question's field alone", () => {
    const base = { ...defaultConfiguration("pharmacy", "fr"), business: { nameLatin: "Test" } };
    const filled = applyAnswers(base, interviewFor("pharmacy"), {
      ph_expiry: false,
      ph_expiry_alert: "6",
    });
    // The alert question is not asked, so the months keep the default rather
    // than quietly recording a preference the owner never expressed.
    expect(filled.features.pharmacy?.expiryAlertMonths).toBe(3);
  });

  it("produces a configuration for every single answer on its own", () => {
    const base = { ...defaultConfiguration("pharmacy", "fr"), business: { nameLatin: "Test" } };
    for (const item of interviewFor("pharmacy")) {
      const filled = applyAnswers(base, interviewFor("pharmacy"), {
        [item.id]: item.default,
      });
      expect(
        configurationSchema.safeParse(filled).success,
        `${item.id} alone`
      ).toBe(true);
    }
  });
});
