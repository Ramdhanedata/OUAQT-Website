import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { paymentsCopy } from "./copy-payments";
import { adminCopy } from "./copy";
import type { ActivityEntry, PaymentLine } from "./payment-history";
import { ActivityList, checkWords, PaymentListItem, type Words } from "./payment-views";

/*
 * The payments pages' pieces drawn with made-up payments, so a list that
 * says the wrong thing (a refund on a refused payment, a check in the wrong
 * words) fails here rather than in front of staff.
 */

const t = adminCopy.fr;
const words: Words = { p: paymentsCopy.fr, plans: t.plans, packs: t.packs, lang: "fr", locale: "fr-FR", staffFallback: t.staffFallback };
const now = new Date("2026-10-03T12:00:00Z");

const line: PaymentLine = {
  id: "8b8a7c2e-0000-4000-8000-000000000001",
  businessId: "8b8a7c2e-0000-4000-8000-0000000000aa",
  businessName: "Pharmacie Essai",
  pack: "pharmacy",
  plan: "semiannual",
  app: "bankily",
  status: "confirmed",
  autoConfirmed: true,
  reviewedAt: null,
  expected: 750_000,
  read: 1_000_000,
  refunded: null,
  refundedAt: null,
  refundedBy: null,
  reference: "BK-555",
  readDate: "2026-10-03",
  recipient: "38087272",
  createdAt: "2026-10-03T10:00:00Z",
  reviewer: null,
  reason: null,
  screenshotPath: "serial/x/y.jpg",
  extracted: { isReceipt: true, amountMru: 10000, recipient: "38087272", date: "2026-10-03", reference: "BK-555" },
  filed: { bySerial: true, planChosen: false, failures: [] },
};

const text = (element: ReturnType<typeof createElement>) =>
  renderToStaticMarkup(element).replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ");

describe("a payment as a line of the list", () => {
  it("says what was sent, what it bought, where it stands and what is owed back", () => {
    const shown = text(createElement(PaymentListItem, { line, words, now }));
    expect(shown).toContain("Pharmacie Essai");
    expect(shown).toContain("Envoyé 10");
    expect(shown).toContain("Semestrielle");
    expect(shown).toContain("Bankily");
    expect(shown).toContain("avec le numéro de série");
    expect(shown).toContain("Confirmé automatiquement, à vérifier");
    expect(shown).toContain("À rembourser : 2");
  });

  it("says a refund was sent once staff said so, and says why a refused one was refused", () => {
    expect(text(createElement(PaymentListItem, { line: { ...line, refunded: 250_000 }, words, now }))).toContain("Remboursé : 2");
    const refused = text(
      createElement(PaymentListItem, {
        line: {
          ...line,
          status: "rejected_auto",
          autoConfirmed: false,
          filed: { ...line.filed, failures: [{ code: "amount_too_low", expected: 750_000, found: 500_000 }] },
        },
        words,
        now,
      })
    );
    expect(refused).toContain("Refusé automatiquement");
    expect(refused).toContain("moins que le prix le plus bas");
    expect(refused).not.toContain("À rembourser");
  });
});

describe("what happened to payments", () => {
  const entry: ActivityEntry = {
    id: 1,
    action: "pending_confirmation",
    at: "2026-10-03T10:00:00Z",
    actor: null,
    paymentId: line.id,
    businessId: line.businessId,
    businessName: "Pharmacie Essai",
    plan: "semiannual",
    amount: 750_000,
    refund: 250_000,
    reason: null,
    failures: [],
    until: null,
  };

  it("names the shop, the event, the length and the amount owed back, and who did it", () => {
    const shown = text(
      createElement(ActivityList, {
        entries: [entry, { ...entry, id: 2, action: "refunded", actor: "Adel", amount: 250_000, refund: 0 }],
        words,
        now,
        withShop: true,
      })
    );
    expect(shown).toContain("Pharmacie Essai");
    expect(shown).toContain("Capture reçue, en attente d'une personne");
    expect(shown).toContain("à rembourser");
    expect(shown).toContain("Remboursement envoyé");
    expect(shown).toContain("Adel");
    expect(shown).toContain("automatique");
  });

  it("puts the amounts of a failed check in money, and every price it could have been", () => {
    expect(checkWords({ code: "wrong_amount", expected: [1_500_000, 750_000], found: 1_000_000 }, words)).toMatch(/Montant 10.000,00 MRU, attendu 15.000,00 MRU \/ 7.500,00 MRU\./);
  });
});
