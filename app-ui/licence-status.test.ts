import { describe, expect, it } from "vitest";
import { clockWoundBack, effectiveStatus, type Licence } from "./licence-status";

const DAY = 86_400_000;
const rules = { renewalGraceDays: 30, clockGraceDays: 2 };

const at = (iso: string) => new Date(iso);

const trial: Licence = {
  plan: "trial",
  startsAt: at("2026-09-01T00:00:00Z"),
  endsAt: at("2026-10-01T00:00:00Z"),
};

describe("a clock that has been wound back", () => {
  it("forgives a day lost to a flat battery", () => {
    const seen = at("2026-09-10T12:00:00Z");
    expect(clockWoundBack(new Date(seen.getTime() - DAY), seen, 2)).toBe(false);
  });

  it("does not forgive a week", () => {
    const seen = at("2026-09-10T12:00:00Z");
    expect(clockWoundBack(new Date(seen.getTime() - 7 * DAY), seen, 2)).toBe(true);
  });

  it("never minds a clock that has moved forward", () => {
    expect(clockWoundBack(at("2026-12-01T00:00:00Z"), at("2026-09-10T00:00:00Z"), 2)).toBe(false);
  });
});

describe("the status the app acts on", () => {
  it("is the ordinary status when the clock is honest", () => {
    const now = at("2026-09-15T00:00:00Z");
    expect(effectiveStatus(trial, now, now, rules)).toEqual({ status: "trial", clockWrong: false });
  });

  it("ends a trial whose clock was wound back to stretch it", () => {
    /* He saw 2 October, when the trial had ended, then set the clock to 15 September. */
    const result = effectiveStatus(trial, at("2026-09-15T00:00:00Z"), at("2026-10-02T00:00:00Z"), rules);
    expect(result).toEqual({ status: "expired_trial", clockWrong: true });
  });

  it("stops an annual licence from selling on a wound-back clock", () => {
    const annual: Licence = { plan: "annual", startsAt: at("2025-10-01T00:00:00Z"), endsAt: at("2026-10-01T00:00:00Z") };
    const result = effectiveStatus(annual, at("2026-06-01T00:00:00Z"), at("2026-09-01T00:00:00Z"), rules);
    expect(result.clockWrong).toBe(true);
    expect(result.status).toBe("expired");
  });

  it("leaves a perpetual licence alone, because it has nothing to stretch", () => {
    const perpetual: Licence = { plan: "perpetual", startsAt: at("2026-01-01T00:00:00Z"), endsAt: null };
    const result = effectiveStatus(perpetual, at("2026-01-02T00:00:00Z"), at("2026-09-01T00:00:00Z"), rules);
    expect(result).toEqual({ status: "active", clockWrong: false });
  });

  it("keeps a suspension a suspension", () => {
    const held: Licence = { ...trial, suspended: true };
    const result = effectiveStatus(held, at("2026-09-01T00:00:00Z"), at("2026-09-20T00:00:00Z"), rules);
    expect(result.status).toBe("suspended");
  });
});
