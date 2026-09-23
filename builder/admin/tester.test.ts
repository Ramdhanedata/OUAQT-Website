import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

beforeAll(() => {
  process.env.SERIAL_SECRET = "a".repeat(64);
});

describe("test mode, and nobody else's way into a closed trade", () => {
  it("opens for a cookie the admin area made", async () => {
    const { makeTesterCookie, isTester } = await import("./tester");
    const cookie = makeTesterCookie();
    expect(cookie).not.toBeNull();
    expect(isTester(cookie!.value)).toBe(true);
  });

  it("stays shut for a cookie somebody wrote by hand", async () => {
    const { isTester } = await import("./tester");
    expect(isTester(`${Date.now() + 86_400_000}.not-a-signature`)).toBe(false);
    expect(isTester("anything")).toBe(false);
    expect(isTester(undefined)).toBe(false);
  });

  it("stays shut once it has expired", async () => {
    const { makeTesterCookie, isTester } = await import("./tester");
    const old = makeTesterCookie(Date.now() - 40 * 86_400_000);
    expect(isTester(old!.value)).toBe(false);
  });

  it("stays shut when the date is pushed forward on a real cookie", async () => {
    const { makeTesterCookie, isTester } = await import("./tester");
    const cookie = makeTesterCookie();
    const [, signature] = cookie!.value.split(".");
    expect(isTester(`${Date.now() + 999 * 86_400_000}.${signature}`)).toBe(false);
  });
});
