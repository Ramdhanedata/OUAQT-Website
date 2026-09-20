import { describe, expect, it } from "vitest";
import { checkPayment } from "./checks";

const base = {
  expectedAmount: 18000,
  bankilyNumber: "38087272",
  paymentMaxAgeDays: 7,
  now: new Date("2026-09-20T12:00:00Z"),
  typedReference: "REF123456",
  extracted: null,
  referenceAlreadyUsed: false,
  imageAlreadyUsed: false,
  aiReadsImages: false,
};

describe("with the AI off", () => {
  it("accepts a payment with a typed reference, for a person to confirm", () => {
    const result = checkPayment(base);
    expect(result.decision).toBe("pending_confirmation");
    expect(result.failures).toEqual([]);
    expect(result.reference).toBe("REF123456");
  });

  it("refuses one with no reference, because there is nothing else to check", () => {
    const result = checkPayment({ ...base, typedReference: "   " });
    expect(result.decision).toBe("rejected_auto");
    expect(result.failures[0].code).toBe("reference_missing");
  });

  it("never sends the screenshot to be read", () => {
    const result = checkPayment({
      ...base,
      extracted: { amountMru: 1, recipient: "00000000", date: "2020-01-01" },
    });
    // The extraction is ignored entirely: on the free tier there is none.
    expect(result.decision).toBe("pending_confirmation");
  });
});

describe("duplicates", () => {
  it("refuses a reference already used", () => {
    const result = checkPayment({ ...base, referenceAlreadyUsed: true });
    expect(result.failures.map((f) => f.code)).toContain("reference_used");
  });

  it("refuses the same screenshot twice", () => {
    const result = checkPayment({ ...base, imageAlreadyUsed: true });
    expect(result.failures.map((f) => f.code)).toContain("image_used");
  });
});

describe("with the AI on", () => {
  const withAi = {
    ...base,
    aiReadsImages: true,
    typedReference: null,
    extracted: {
      amountMru: 18000,
      recipient: "38087272",
      date: "2026-09-19",
      reference: "BNK-99",
    },
  };

  it("accepts a screenshot that matches", () => {
    const result = checkPayment(withAi);
    expect(result.decision).toBe("pending_confirmation");
    expect(result.reference).toBe("BNK-99");
  });

  it("says what the amount was and what it should have been", () => {
    const result = checkPayment({
      ...withAi,
      extracted: { ...withAi.extracted, amountMru: 15000 },
    });
    expect(result.failures[0]).toEqual({
      code: "wrong_amount",
      expected: 18000,
      found: 15000,
    });
  });

  it("refuses a transfer sent to somebody else", () => {
    const result = checkPayment({
      ...withAi,
      extracted: { ...withAi.extracted, recipient: "22299999" },
    });
    expect(result.failures.map((f) => f.code)).toContain("wrong_recipient");
  });

  it("accepts the same number written with a country code", () => {
    const result = checkPayment({
      ...withAi,
      extracted: { ...withAi.extracted, recipient: "+222 38 08 72 72" },
    });
    expect(result.failures).toEqual([]);
  });

  it("refuses a transfer older than the window", () => {
    const result = checkPayment({
      ...withAi,
      extracted: { ...withAi.extracted, date: "2026-09-01" },
    });
    expect(result.failures[0]).toMatchObject({ code: "too_old", expected: 7 });
  });

  it("does not treat an unreadable field as a wrong one", () => {
    const result = checkPayment({
      ...withAi,
      extracted: { amountMru: null, recipient: null, date: null, reference: "BNK-42" },
    });
    expect(result.decision).toBe("pending_confirmation");
  });

  it("takes the owner's typed reference over the one it read", () => {
    const result = checkPayment({ ...withAi, typedReference: "TYPED-1" });
    expect(result.reference).toBe("TYPED-1");
  });
});

describe("what the checks can never do", () => {
  it("has no outcome that means paid", () => {
    const outcomes = new Set<string>();
    for (const referenceAlreadyUsed of [true, false]) {
      for (const imageAlreadyUsed of [true, false]) {
        for (const aiReadsImages of [true, false]) {
          outcomes.add(
            checkPayment({ ...base, referenceAlreadyUsed, imageAlreadyUsed, aiReadsImages })
              .decision
          );
        }
      }
    }
    expect(Array.from(outcomes).sort()).toEqual([
      "pending_confirmation",
      "rejected_auto",
    ]);
  });
});
