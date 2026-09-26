import { describe, expect, it } from "vitest";
import { addressFrom, networkOf, placeHash } from "./place";

describe("where a download came from", () => {
  it("keeps an IPv4 address whole", () => {
    expect(networkOf("41.188.10.7")).toBe("41.188.10.7");
    expect(networkOf("::ffff:41.188.10.7")).toBe("41.188.10.7");
  });

  it("cuts an IPv6 address to its network, however it is written", () => {
    expect(networkOf("2a01:cb00:0a12:3400:1c2d:5e6f:7a8b:9c0d")).toBe("2a01:cb00:a12:3400::/64");
    expect(networkOf("2a01:cb00:a12:3400::1")).toBe("2a01:cb00:a12:3400::/64");
    expect(networkOf("[2a01:cb00:a12:3400::1]")).toBe("2a01:cb00:a12:3400::/64");
    expect(networkOf("2a01:cb00::1")).toBe("2a01:cb00:0:0::/64");
  });

  it("refuses what is not an address", () => {
    expect(networkOf("unknown")).toBeNull();
    expect(networkOf("1::2::3")).toBeNull();
    expect(networkOf("")).toBeNull();
  });

  it("reads the first forwarded address", () => {
    expect(addressFrom(new Headers({ "x-forwarded-for": "41.188.10.7, 10.0.0.1" }))).toBe("41.188.10.7");
    expect(addressFrom(new Headers({ "x-real-ip": "41.188.10.8" }))).toBe("41.188.10.8");
    expect(addressFrom(new Headers())).toBeNull();
  });

  it("gives one mark per connection, and none without a secret", async () => {
    const a = await placeHash("2a01:cb00:a12:3400::1", "secret");
    const b = await placeHash("2a01:cb00:a12:3400:ffff::9", "secret");
    const c = await placeHash("41.188.10.7", "secret");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await placeHash("41.188.10.7", "")).toBeNull();
    expect(await placeHash("41.188.10.7", "other")).not.toBe(c);
  });
});
