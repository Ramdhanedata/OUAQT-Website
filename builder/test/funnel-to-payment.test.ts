import { beforeAll, describe, expect, it, vi } from "vitest";
import { fakeDatabase } from "./fake-database";

/*
 * The whole road an owner takes, through the real routes, one after the
 * other: his answers become a number, the number opens his software on a
 * computer with a free trial, his screenshot of a transfer pays for a month,
 * and the next licence check brings the paid licence back to the software.
 *
 * The database is held in memory (fake-database.ts), the settings are fixed
 * here, and the only thing invented is what the AI reads off the screenshot.
 * Licences are really signed, with a key made for this test.
 */

const VISITOR = "visitor-1";
const db = fakeDatabase({ id: VISITOR });

const PAY_TO = "22238087272";
const MONTH = 130_000; // 1 300 MRU, in hundredths

const publicSettings = {
  trial_days: 30,
  renewal_grace_days: 7,
  max_devices: 2,
  support_whatsapp: "22200000000",
  price_installation_builder_mru: null,
  price_annual_launch_mru: 1_500_000,
  price_annual_standard_mru: 1_800_000,
  price_quarterly_standard_mru: 390_000,
  price_semiannual_launch_mru: 750_000,
  price_semiannual_standard_mru: 900_000,
  price_quarterly_launch_mru: 350_000,
  price_bimonthly_launch_mru: 230_000,
  price_bimonthly_standard_mru: 260_000,
  price_monthly_launch_mru: MONTH,
  price_monthly_standard_mru: MONTH,
  price_setup_visit_mru: null,
  price_extra_device_launch_mru: null,
  price_extra_device_standard_mru: null,
  price_installation_launch_mru: null,
  price_installation_standard_mru: null,
  price_perpetual_launch_mru: null,
  price_perpetual_standard_mru: null,
  bespoke_maintenance_percent: null,
  bespoke_maintenance_from_month: null,
  launch_clients_limit: null,
  launch_price_freeze_years: null,
  referral_free_months: null,
  tutorial_video_windows_url: "",
  tutorial_video_mac_url: "",
  ...Object.fromEntries(
    ["pharmacy", "bakery", "restaurant", "warehouse", "shop", "hotel", "transport", "wash", "general"].flatMap((pack) => [
      [`installer_url_windows_${pack}`, `https://downloads.test/${pack}.exe`],
      [`installer_url_mac_${pack}`, `https://downloads.test/${pack}.dmg`],
    ])
  ),
};

const privateSettings = {
  bankily_number: PAY_TO,
  masrvi_number: "",
  bimbank_number: "",
  sedad_number: "",
  click_number: "",
  payment_auto_confirm: true,
  payment_max_age_days: 7,
  device_releases_per_year: 2,
  clock_grace_days: 3,
  trial_summary_days: 7,
  trial_one_per_fingerprint: true,
  trial_one_per_phone: true,
  trial_require_fingerprint: false,
  trial_fingerprint_parts_to_match: 2,
  trial_similarity_percent: 80,
  activation_token_hours: 24,
  activation_nearby_hours: 6,
  ai_calls_per_day: 500,
};

/* What the AI reads off his screenshot: the month's price, sent today to OUAQT's number. */
const today = new Date().toISOString().slice(0, 10);
let readOff: Record<string, unknown> | null = { isReceipt: true, amountMru: MONTH / 100, recipient: PAY_TO, date: today, reference: "TX-0001" };

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("@/builder/db/server", () => ({ adminClient: () => db.client, requestClient: async () => db.client }));
vi.mock("@/builder/db/audit", () => ({ audit: async () => {} }));
vi.mock("@/builder/db/settings", async (original) => ({
  ...(await original<typeof import("@/builder/db/settings")>()),
  getPublicSettings: async () => publicSettings,
  getTrialDays: async () => publicSettings.trial_days,
}));
vi.mock("@/builder/db/private-settings", async (original) => ({
  ...(await original<typeof import("@/builder/db/private-settings")>()),
  getPrivateSettings: async () => privateSettings,
}));
vi.mock("@/builder/payment/read", () => ({ readReceipt: async () => readOff }));
vi.mock("@/builder/notify/whatsapp", () => ({ sendNumber: async () => ({ sent: false }) }));

const DEVICE = { deviceId: "computer-of-the-shop-1", platform: "windows" as const };
const FINGERPRINT = { board: "b".repeat(64), disk: "d".repeat(64), machine: "m".repeat(64) };

/* The signed licence's own words, without checking the signature: the app does that. */
const licenceIn = (signed: string) => JSON.parse(Buffer.from(signed.split(".")[0], "base64url").toString("utf8"));

const post = (body: unknown) =>
  new Request("http://ouaqt.test/api", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "41.188.0.1" }, body: JSON.stringify(body) });

beforeAll(async () => {
  process.env.SERIAL_SECRET = "s".repeat(48);
  const pair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
  process.env.LICENCE_SIGNING_KEY = Buffer.from(await crypto.subtle.exportKey("pkcs8", pair.privateKey)).toString("base64url");

  /* What the builder saved as he answered: his trade, his shop's name and his phone. */
  db.rowsOf("builder_drafts").push({
    id: "draft-1",
    session_owner: VISITOR,
    business_id: null,
    pack: "shop",
    locale: "fr",
    step: 2,
    answers: { pack: "shop", builderLanguage: "fr", nameLatin: "Boutique Test", phone: "22233445566", address: "Tevragh Zeina" },
    serial_hash: null,
    serial_cipher: null,
    phone: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_accessed_at: null,
    status: "active",
    logo_path: null,
    logo_mono_path: null,
    made_in_test_mode: false,
  });
});

describe("from the builder's last step to a paid licence in the software", () => {
  let serial = "";
  let businessId = "";
  let deviceToken = "";

  it("gives his answers a number", async () => {
    const { POST } = await import("@/app/api/builder/configuration-code/route");
    const answer = await POST(post({ language: "fr" }));
    expect(answer.status).toBe(200);
    const body = await answer.json();
    expect(body.serial).toMatch(/^[0-9A-Z]{8}$/);
    serial = body.serial;
    expect(db.rowsOf("businesses")).toHaveLength(0);
  });

  it("asked twice, gives the same number", async () => {
    const { POST } = await import("@/app/api/builder/configuration-code/route");
    const again = await (await POST(post({ language: "fr" }))).json();
    expect(again.serial).toBe(serial);
  });

  it("opens his software on a computer with that number: the shop is made and its free trial starts", async () => {
    const { POST } = await import("@/app/api/licence/activate/route");
    const answer = await POST(post({ serial, ...DEVICE, fingerprint: FINGERPRINT, appVersion: "0.1.102" }));
    const body = await answer.json();
    expect(answer.status, JSON.stringify(body)).toBe(200);
    const licence = licenceIn(body.licence);
    businessId = licence.businessId;
    deviceToken = body.deviceToken;
    expect(businessId).toBeTruthy();
    expect(deviceToken).toBeTruthy();
    expect(db.rowsOf("businesses")[0]).toMatchObject({ name_latin: "Boutique Test", pack: "shop" });
    expect(licence.status).toBe("trial");
    expect(licence.endsAt).toBeTruthy();
    expect(body.serial).toBe(serial);
  });

  it("refuses a screenshot of the wrong amount, and the trial stays as it was", async () => {
    readOff = { isReceipt: true, amountMru: 500, recipient: PAY_TO, date: today, reference: "TX-0000" };
    const answer = await pay(serial, 1);
    expect(answer.decision).toBe("rejected_auto");
    expect(db.rowsOf("licences").find((one) => one.business_id === businessId)?.status).toBe("trial");
  });

  it("takes a screenshot of a month's price sent to OUAQT today, and opens the licence at once", async () => {
    readOff = { isReceipt: true, amountMru: MONTH / 100, recipient: PAY_TO, date: today, reference: "TX-0001" };
    const answer = await pay(serial, 2);
    expect(answer.decision, JSON.stringify(answer)).toBe("confirmed");
    expect(answer.plan).toBe("monthly");
    expect(answer.endsAt).toBeTruthy();
  });

  it("brings the paid licence back to the software at its next check", async () => {
    const { POST } = await import("@/app/api/licence/refresh/route");
    const answer = await POST(post({ businessId, deviceId: DEVICE.deviceId, deviceToken, appVersion: "0.1.102" }));
    const body = await answer.json();
    expect(answer.status, JSON.stringify(body)).toBe(200);
    const licence = licenceIn(body.licence);
    expect(licence.status).toBe("active");
    expect(new Date(licence.endsAt).getTime()).toBeGreaterThan(Date.now() + 25 * 86_400_000);
    expect(body.serial).toBe(serial);
  });

  it("does not take the same screenshot twice", async () => {
    const answer = await pay(serial, 2);
    expect(answer.decision).toBe("rejected_auto");
  });
});

/* A small JPEG: the route checks the first three bytes, and its hash tells two screenshots apart. */
async function pay(serial: string, picture: number) {
  const { POST } = await import("@/app/api/builder/payment/serial/route");
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, picture, 0, 0, 0]);
  const form = new FormData();
  form.set("number", serial);
  form.set("image", new Blob([jpeg], { type: "image/jpeg" }), "capture.jpg");
  const answer = await POST(new Request("http://ouaqt.test/api/builder/payment/serial", { method: "POST", headers: { "x-forwarded-for": "41.188.0.1" }, body: form }));
  return answer.json();
}
