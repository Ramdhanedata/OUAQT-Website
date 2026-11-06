import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getBuilderCopy } from "@/builder/copy";
import type { Price } from "@/builder/payment/pricing";
import { PaymentReceived, SendScreenshot } from "./pay";

/*
 * The owner's payment screens drawn with made-up prices: every length that
 * has a price is there to pick, with what to send for it, and a confirmed
 * payment says the length it bought. Amounts are invented for the test.
 */

const fr = getBuilderCopy("fr");
const ar = getBuilderCopy("ar");
const payTo = [{ app: "bankily" as const, number: "38087272" }];

const text = (element: ReturnType<typeof createElement>) =>
  renderToStaticMarkup(element)
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/ | /g, " ")
    .replace(/\s+/g, " ");

const price = (plan: Price["plan"], amount: number | null): Price => ({ plan, amount, standard: amount, launch: false });

const allFive = [
  price("annual", 1500000),
  price("semiannual", 750000),
  price("quarterly", 450000),
  price("bimonthly", 320000),
  price("monthly", 170000),
];

describe("the screenshot page, for an owner who has not paid yet", () => {
  it("offers every priced length, each with its amount, the year first", () => {
    const shown = text(
      createElement(SendScreenshot, { copy: fr, language: "fr", serial: "BQ46Y7K8", prices: allFive, payTo, onSent: () => {} })
    );
    for (const label of ["1 an", "6 mois", "3 mois", "2 mois", "1 mois"]) expect(shown).toContain(label);
    for (const amount of ["15 000", "7 500", "4 500", "3 200", "1 700"]) expect(shown).toContain(amount);
    expect(shown).toContain("Payer pour");
    /* Until he picks, it says what a year costs. */
    expect(shown).toMatch(/Envoyez 15 000(,00)? MRU pour 1 an au 38087272/);
  });

  it("leaves out a length nobody has priced", () => {
    const shown = text(
      createElement(SendScreenshot, {
        copy: fr,
        language: "fr",
        serial: "BQ46Y7K8",
        prices: [price("annual", 1500000), price("semiannual", 750000), price("quarterly", 450000)],
        payTo,
        onSent: () => {},
      })
    );
    expect(shown).toContain("3 mois");
    expect(shown).not.toContain("2 mois");
    expect(shown).not.toContain("1 mois");
  });

  it("asks nothing to choose when only one length is priced", () => {
    const shown = text(
      createElement(SendScreenshot, { copy: fr, language: "fr", serial: "BQ46Y7K8", prices: [price("annual", 1500000)], payTo, onSent: () => {} })
    );
    expect(shown).not.toContain("Payer pour");
    expect(shown).toMatch(/Envoyez 15 000(,00)? MRU pour 1 an/);
  });
});

describe("a confirmed payment", () => {
  it.each([
    ["monthly", "Votre paiement pour 1 mois est réussi"],
    ["bimonthly", "Votre paiement pour 2 mois est réussi"],
    ["quarterly", "Votre paiement pour 3 mois est réussi"],
    ["semiannual", "Votre paiement pour 6 mois est réussi"],
    ["annual", "Votre paiement pour 1 an est réussi"],
  ])("says what %s bought", (plan, said) => {
    const shown = text(
      createElement(PaymentReceived, { copy: fr, language: "fr", read: null, confirmed: true, plan, endsAt: "2026-12-06T10:00:00.000Z" })
    );
    expect(shown).toContain(said);
  });

  it("says it in Arabic too", () => {
    const shown = text(createElement(PaymentReceived, { copy: ar, language: "ar", read: null, confirmed: true, plan: "bimonthly" }));
    expect(shown).toContain("تم دفع اشتراك شهرين بنجاح");
  });
});
