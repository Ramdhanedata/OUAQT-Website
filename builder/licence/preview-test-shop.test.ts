import { afterEach, describe, expect, it, vi } from "vitest";
import { configurationSchema } from "@/app-ui/config";
import { packs } from "@/app-ui/packs";

/* The module is server-only; the rule it holds is plain and tested here without a server. */
vi.mock("server-only", () => ({}));
vi.mock("./issue", () => ({
  issueLicence: async (input: unknown) => JSON.stringify(input),
}));

const { previewTestShop, testShopPack } = await import("./preview-test-shop");

const phone = { serial: "TESTSHOP", deviceId: "a-phone-device", platform: "phone" };

afterEach(() => {
  vi.unstubAllEnvs();
});

/*
 * The door that skips the serial exists on previews, for phones, and nowhere
 * else. If production ever answered here, anyone could open a shop for free.
 */
describe("the test shop answers on a preview only", () => {
  it("answers nothing in production", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(await previewTestShop(phone)).toBeNull();
  });

  it("answers nothing away from Vercel", async () => {
    vi.stubEnv("VERCEL_ENV", "");
    expect(await previewTestShop(phone)).toBeNull();
  });

  it("answers nothing to a computer, even on a preview", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(await previewTestShop({ ...phone, platform: "windows" })).toBeNull();
  });

  it("answers nothing to a real serial, even on a preview", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(await previewTestShop({ ...phone, serial: "RXVE7DV3" })).toBeNull();
    expect(await previewTestShop({ ...phone, serial: undefined })).toBeNull();
  });
});

describe("the test shop itself", () => {
  it("reads a trade from the code, in any case, and no other word", () => {
    expect(testShopPack("TESTPHARMACY")).toBe("pharmacy");
    expect(testShopPack(" testshop ")).toBe("shop");
    expect(testShopPack("TESTNOTHING")).toBeNull();
    expect(testShopPack("SHOP")).toBeNull();
  });

  it.each(packs)("gives %s a configuration the app accepts, with products", async (pack) => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const answer = await previewTestShop({ ...phone, serial: `TEST${pack.toUpperCase()}` });
    expect(configurationSchema.safeParse(answer?.configuration).success).toBe(true);
    expect(answer?.configuration.pack).toBe(pack);
    expect(answer?.products.length).toBeGreaterThan(0);
    for (const product of answer?.products ?? []) expect(Number.isInteger(product.price)).toBe(true);
  });

  it("licenses this phone, as this phone", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const answer = await previewTestShop({ ...phone, fingerprint: { machine: "a-hashed-phone-id" } });
    const issued = JSON.parse(String(answer?.licence));
    expect(issued.devices[0].device_id).toBe("a-phone-device");
    expect(issued.devices[0].fingerprint.machine).toBe("a-hashed-phone-id");
    expect(issued.licence.plan).toBe("trial");
  });
});
