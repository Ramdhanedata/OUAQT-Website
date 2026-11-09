import { describe, expect, it } from "vitest";
import {
  repeatSignals,
  sameMachine,
  samePhone,
  sameTrade,
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
    pack: "pharmacy",
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

  it("knows a phone again by the one part it reports", () => {
    const phone = (id: string) => ({ board: null, disk: null, machine: id });
    expect(sameMachine(phone("p1"), phone("p1"), 2)).toBe(true);
    expect(sameMachine(phone("p1"), phone("p2"), 2)).toBe(false);
  });

  it("never takes a phone for a computer", () => {
    expect(sameMachine({ board: null, disk: null, machine: "p1" }, machine("b1", "d1", "m1"), 2)).toBe(false);
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

  it("refuses the same trade again on that machine, as a reinstall would ask", () => {
    const reinstalled = claim({ businessId: "business-2", phone: "22233445566" });
    expect(trialAllowed(reinstalled, [claim({ pack: "restaurant" }), claim()], rules)).toEqual({
      allowed: false,
      because: "same_machine",
    });
  });

  it("gives the same machine a trial for another trade", () => {
    const pharmacy = claim({ businessId: "business-2", phone: "22233445566", pack: "pharmacy" });
    expect(trialAllowed(pharmacy, [claim({ pack: "restaurant" })], rules).allowed).toBe(true);
  });

  it("gives the same phone number a trial for another trade", () => {
    const pharmacy = claim({ businessId: "business-2", fingerprint: machine("b9", "d9", "m9") });
    expect(trialAllowed(pharmacy, [claim({ pack: "restaurant" })], rules).allowed).toBe(true);
  });

  it("gives a phone a trial for each trade, once", () => {
    const phone = { board: null, disk: null, machine: "p1" };
    const restaurant = claim({ fingerprint: phone, pack: "restaurant" });
    const pharmacy = claim({ businessId: "business-2", fingerprint: phone, phone: "22233445566" });
    expect(trialAllowed(pharmacy, [restaurant], rules).allowed).toBe(true);
    expect(trialAllowed(claim({ businessId: "business-3", fingerprint: phone, phone: "22299887766" }), [restaurant, pharmacy], rules)).toEqual({
      allowed: false,
      because: "same_machine",
    });
  });

  it("still gives one shop one trial when it changes trade", () => {
    expect(trialAllowed(claim({ pack: "restaurant" }), [claim()], rules)).toEqual({
      allowed: false,
      because: "same_business",
    });
  });

  it("counts an earlier trial of unknown trade as the same trade", () => {
    expect(sameTrade({ pack: null }, { pack: "pharmacy" })).toBe(true);
    const unknown = claim({ pack: null });
    expect(trialAllowed(claim({ businessId: "business-2", phone: "22233445566" }), [unknown], rules)).toEqual({
      allowed: false,
      because: "same_machine",
    });
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

  it("says nothing about the same owner trying another trade", () => {
    const signals = repeatSignals(
      claim({ businessId: "business-2", logoHash: "logo-a", pack: "restaurant" }),
      [claim({ logoHash: "logo-a" })],
      rules
    );
    expect(signals).toEqual([]);
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
