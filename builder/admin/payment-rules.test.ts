import { describe, expect, it } from "vitest";
import { matchesFilter, owedBack, refundOwed, stateOf, summaryOf, type PaymentFacts } from "./payment-rules";

const paid: PaymentFacts = { status: "confirmed", autoConfirmed: true, reviewedAt: null, expected: 750_000, read: 750_000, refunded: null, failures: [] };

describe("where a payment stands", () => {
  it("tells apart a confirmation by the screenshot, looked at or not, from one by a person", () => {
    expect(stateOf(paid)).toBe("confirmed_auto");
    expect(stateOf({ ...paid, reviewedAt: "2026-10-03T10:00:00Z" })).toBe("confirmed_auto_checked");
    expect(stateOf({ ...paid, autoConfirmed: false })).toBe("confirmed");
  });

  it("calls an automatic confirmation a person took back undone, not refused", () => {
    expect(stateOf({ ...paid, status: "rejected_manual" })).toBe("undone");
    expect(stateOf({ ...paid, status: "rejected_manual", autoConfirmed: false })).toBe("rejected_manual");
    expect(stateOf({ ...paid, status: "rejected_auto", autoConfirmed: false })).toBe("rejected_auto");
    expect(stateOf({ ...paid, status: "pending_confirmation", autoConfirmed: false })).toBe("pending");
  });
});

describe("what is owed back", () => {
  it("is what a confirmed payment sent beyond its price, until staff say they sent it", () => {
    const more = { ...paid, read: 1_000_000 };
    expect(owedBack(more)).toBe(250_000);
    expect(refundOwed(more)).toBe(250_000);
    expect(refundOwed({ ...more, refunded: 250_000 })).toBe(0);
    expect(matchesFilter("refund", more)).toBe(true);
    expect(matchesFilter("refund", { ...more, refunded: 250_000 })).toBe(false);
  });

  it("is all of a payment refused only for being less than the smallest price", () => {
    const tooLittle = { ...paid, status: "rejected_auto", autoConfirmed: false, read: 500_000, failures: ["amount_too_low"] };
    expect(owedBack(tooLittle)).toBe(500_000);
    expect(matchesFilter("refund", tooLittle)).toBe(true);
    expect(matchesFilter("refused", tooLittle)).toBe(true);
  });

  it("is nothing for one refused for anything else, or whose amount nobody read", () => {
    expect(owedBack({ ...paid, read: 1_000_000, status: "rejected_auto", failures: ["wrong_recipient"] })).toBe(0);
    expect(owedBack({ ...paid, read: 500_000, status: "rejected_auto", failures: ["amount_too_low", "wrong_date"] })).toBe(0);
    expect(owedBack({ ...paid, read: null })).toBe(0);
  });
});

describe("the figures above the list", () => {
  it("count this month's payments at their price, and what is still to handle and to refund", () => {
    const now = new Date("2026-10-20T12:00:00Z");
    const rows = [
      { ...paid, createdAt: "2026-10-03T09:00:00Z" },
      { ...paid, expected: 1_500_000, read: 2_000_000, autoConfirmed: false, createdAt: "2026-10-05T09:00:00Z" },
      { ...paid, reviewedAt: "2026-09-02T09:00:00Z", createdAt: "2026-09-01T09:00:00Z" },
      { ...paid, status: "pending_confirmation", autoConfirmed: false, createdAt: "2026-10-06T09:00:00Z" },
      { ...paid, status: "rejected_auto", autoConfirmed: false, createdAt: "2026-10-07T09:00:00Z" },
    ];
    expect(summaryOf(rows, now)).toEqual({
      monthCount: 2,
      monthAmount: 2_250_000,
      allAmount: 3_000_000,
      toHandle: 2,
      refundCount: 1,
      refundAmount: 500_000,
    });
  });
});
