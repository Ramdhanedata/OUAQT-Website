import { describe, expect, it } from "vitest";
import { actionsFor, controlGroupOf, daysUntil } from "./control-rules";

describe("where a shop stands", () => {
  it("is banned before anything else", () => {
    expect(controlGroupOf({ banned: true, status: "active", plan: "perpetual", gift: true })).toBe("banned");
  });

  it("is suspended before its dates say anything", () => {
    expect(controlGroupOf({ banned: false, status: "suspended", plan: "annual", gift: false })).toBe("suspended");
  });

  it("tells a lifetime gift from a lifetime licence paid for", () => {
    expect(controlGroupOf({ banned: false, status: "active", plan: "perpetual", gift: true })).toBe("lifetime");
    expect(controlGroupOf({ banned: false, status: "active", plan: "perpetual", gift: false })).toBe("paid");
  });

  it("follows the dates otherwise", () => {
    expect(controlGroupOf({ banned: false, status: "trial", plan: "trial", gift: false })).toBe("trial");
    expect(controlGroupOf({ banned: false, status: "expired_trial", plan: "trial", gift: false })).toBe("trial_over");
    expect(controlGroupOf({ banned: false, status: "renewal_due", plan: "annual", gift: false })).toBe("renewal");
    expect(controlGroupOf({ banned: false, status: "expired", plan: "annual", gift: false })).toBe("expired");
    expect(controlGroupOf({ banned: false, status: null, plan: null, gift: false })).toBe("none");
  });
});

describe("days left", () => {
  const now = new Date("2026-10-02T12:00:00Z");
  it("counts whole days up, never below nothing", () => {
    expect(daysUntil("2026-10-03T00:00:00Z", now)).toBe(1);
    expect(daysUntil("2026-10-12T12:00:00Z", now)).toBe(10);
    expect(daysUntil("2026-09-01T00:00:00Z", now)).toBe(0);
    expect(daysUntil(null, now)).toBeNull();
  });
});

describe("what staff can do", () => {
  it("only unbans a banned shop", () => {
    expect(actionsFor({ group: "banned", plan: "annual" })).toEqual(["unban"]);
  });

  it("stops, extends or gives a running trial for life", () => {
    const trial = actionsFor({ group: "trial", plan: "trial" });
    expect(trial).toEqual(expect.arrayContaining(["gift", "extend", "stop_trial", "suspend", "ban"]));
    expect(trial).not.toContain("cancel");
  });

  it("cancels a lifetime gift, never extends or gives it again", () => {
    const lifetime = actionsFor({ group: "lifetime", plan: "perpetual" });
    expect(lifetime).toContain("cancel");
    expect(lifetime).not.toContain("gift");
    expect(lifetime).not.toContain("extend");
  });

  it("reactivates a suspended shop instead of suspending it again", () => {
    const suspended = actionsFor({ group: "suspended", plan: "annual" });
    expect(suspended).toContain("reactivate");
    expect(suspended).not.toContain("suspend");
  });
});
