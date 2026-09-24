import { describe, expect, it } from "vitest";
import {
  repeatSignals,
  sameMachine,
  samePhone,
  similarity,
  trialAllowed,
  type Claim,
  type Fingerprint,
  type TrialRules,
} from "./trial";

const rules: TrialRules = {
  onePerFingerprint: true,
  onePerPhone: true,
  requireFingerprint: true,
  fingerprintPartsToMatch: 2,
  similarityPercent: 80,
};

function machine(board: string, disk: string, id: string): Fingerprint {
  return { board, disk, machine: id };
}

function claim(over: Partial<Claim> = {}): Claim {
  return {
    businessId: "business-1",
    fingerprint: machine("b1", "d1", "m1"),
    phone: "38087272",
    logoHash: null,
    productsHash: null,
    name: "Pharmacie El Waha",
    address: "Tevragh Zeina, Nouakchott",
    ...over,
  };
}

describe("the same machine, through the things that change on it", () => {
  it("knows a machine that has not changed", () => {
    expect(sameMachine(machine("b1", "d1", "m1"), machine("b1", "d1", "m1"), 2)).toBe(true);
  });

  it("still knows it after the disk is replaced", () => {
    expect(sameMachine(machine("b1", "d9", "m1"), machine("b1", "d1", "m1"), 2)).toBe(true);
  });

  it("still knows it after the system is reinstalled", () => {
    expect(sameMachine(machine("b1", "d1", "m9"), machine("b1", "d1", "m1"), 2)).toBe(true);
  });

  it("does not mistake a different computer for it", () => {
    expect(sameMachine(machine("b9", "d9", "m9"), machine("b1", "d1", "m1"), 2)).toBe(false);
  });

  it("does not call two unknown parts a match", () => {
    const blank = { board: null, disk: null, machine: null };
    expect(sameMachine(blank, blank, 2)).toBe(false);
  });
});

describe("the same phone, written differently", () => {
  it("sees through spaces and a country code", () => {
    expect(samePhone("+222 38 08 72 72", "22238087272")).toBe(true);
    expect(samePhone("38087272", "38087272")).toBe(true);
  });

  it("does not match a missing number with anything", () => {
    expect(samePhone(null, "38087272")).toBe(false);
    expect(samePhone("", "38087272")).toBe(false);
  });
});

describe("who may start a trial", () => {
  it("lets the first shop through", () => {
    expect(trialAllowed(claim(), [], rules).allowed).toBe(true);
  });

  it("gives one shop one trial, however many computers it has", () => {
    const decision = trialAllowed(claim(), [claim()], rules);
    expect(decision).toEqual({ allowed: false, because: "same_business" });
  });

  it("refuses a second shop on the same machine", () => {
    const decision = trialAllowed(
      claim({ businessId: "business-2", phone: "22233445566" }),
      [claim()],
      rules
    );
    expect(decision).toEqual({ allowed: false, because: "same_machine" });
  });

  it("refuses a second shop on the same phone", () => {
    const decision = trialAllowed(
      claim({ businessId: "business-2", fingerprint: machine("b9", "d9", "m9") }),
      [claim()],
      rules
    );
    expect(decision).toEqual({ allowed: false, because: "same_phone" });
  });

  it("refuses an app that sends no fingerprint at all", () => {
    const decision = trialAllowed(
      claim({ fingerprint: { board: null, disk: null, machine: null } }),
      [],
      rules
    );
    expect(decision).toEqual({ allowed: false, because: "no_fingerprint" });
  });

  it("lets a fingerprint through when the rule is switched off", () => {
    const decision = trialAllowed(
      claim({ businessId: "business-2", phone: "22233445566" }),
      [claim()],
      { ...rules, onePerFingerprint: false }
    );
    expect(decision.allowed).toBe(true);
  });
});

/*
 * The honest cases. Both of these are people we would otherwise turn away,
 * and both of them are the reason there is a person behind the rule.
 */
describe("the owners the rule is wrong about", () => {
  it("a repaired PC with a new disk is the same machine, so its owner keeps his trial", () => {
    const repaired = claim({ fingerprint: machine("b1", "NEW-DISK", "m1") });
    expect(sameMachine(repaired.fingerprint, claim().fingerprint, 2)).toBe(true);
    expect(trialAllowed(repaired, [claim()], rules)).toEqual({
      allowed: false,
      because: "same_business",
    });
  });

  it("a second-hand PC bought from another shop is refused, and the refusal names why", () => {
    const secondHand = claim({
      businessId: "business-2",
      phone: "22233445566",
      name: "Boulangerie Nouvelle",
    });
    const decision = trialAllowed(secondHand, [claim()], rules);
    /*
     * Refused, but with a reason a person can act on: this is the case the
     * admin override exists for, and the copy for it offers WhatsApp rather
     * than saying no and stopping.
     */
    expect(decision).toEqual({ allowed: false, because: "same_machine" });
  });

  it("lets that owner through once he has been given a trial by hand", () => {
    const secondHand = claim({ businessId: "business-2", phone: "22233445566" });
    /* An override is checked before these rules run, so the list is empty. */
    expect(trialAllowed(secondHand, [], rules).allowed).toBe(true);
  });
});

describe("what looks like the same shop twice", () => {
  it("notices the same logo", () => {
    const signals = repeatSignals(
      claim({ businessId: "business-2", logoHash: "logo-a", name: "Autre" }),
      [claim({ logoHash: "logo-a" })],
      rules
    );
    expect(signals).toContain("same_logo");
  });

  it("notices the same product list", () => {
    const signals = repeatSignals(
      claim({ businessId: "business-2", productsHash: "p-a", name: "Autre" }),
      [claim({ productsHash: "p-a" })],
      rules
    );
    expect(signals).toContain("same_products");
  });

  it("notices a name written a little differently", () => {
    const signals = repeatSignals(
      claim({ businessId: "business-2", name: "pharmacie el-waha" }),
      [claim({ name: "Pharmacie El Waha" })],
      rules
    );
    expect(signals).toContain("similar_name");
  });

  it("says nothing about two shops that merely share a street", () => {
    const signals = repeatSignals(
      claim({
        businessId: "business-2",
        name: "Boulangerie Chinguitti",
        address: "Ksar, Nouakchott",
      }),
      [claim({ name: "Pharmacie El Waha", address: "Tevragh Zeina, Nouakchott" })],
      rules
    );
    expect(signals).toEqual([]);
  });

  it("never refuses anything by itself", () => {
    const twin = claim({ businessId: "business-2", phone: "22233445566", fingerprint: machine("b9", "d9", "m9") });
    expect(repeatSignals(twin, [claim()], rules).length).toBeGreaterThan(0);
    expect(trialAllowed(twin, [claim()], rules).allowed).toBe(true);
  });
});

describe("how alike two names look", () => {
  it("calls the same words the same, through accents and dashes", () => {
    expect(similarity("Pharmacie El Wahá", "pharmacie el-waha")).toBe(100);
  });

  it("scores two different trades far apart", () => {
    expect(similarity("Pharmacie El Waha", "Boulangerie Chinguitti")).toBeLessThan(50);
  });

  it("scores an empty name at zero rather than matching everything", () => {
    expect(similarity("", "Pharmacie El Waha")).toBe(0);
  });
});
