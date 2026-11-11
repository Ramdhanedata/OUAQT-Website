import { beforeEach, describe, expect, it, vi } from "vitest";

/*
 * OUAQT's own test devices (0040), through the real activation route and the
 * real trade settling, over a small database held in memory. Everything that
 * is not about trials or device places (signing, the shop's setup, the rate
 * limit) is stubbed.
 */

type Row = Record<string, unknown>;
let tables: Record<string, Row[]> = {};

/* Just enough of the Supabase query builder for the queries these two paths make. */
function from(table: string) {
  const filters: ((row: Row) => boolean)[] = [];
  let mode: "select" | "insert" | "update" = "select";
  let patch: Row = {};
  let columns = "*";
  let limit: number | null = null;

  const embed = (row: Row): Row => {
    if (!columns.includes("businesses(")) return { ...row };
    const shop = (tables.businesses ?? []).find((one) => one.id === row.business_id) ?? null;
    const claims = (tables.trial_claims ?? []).filter((one) => one.business_id === row.business_id);
    return { ...row, businesses: shop ? { ...shop, trial_claims: claims } : null };
  };

  const run = async () => {
    if (mode === "insert") return { data: null, error: null };
    const rows = (tables[table] ?? []).filter((row) => filters.every((keep) => keep(row)));
    if (mode === "update") {
      rows.forEach((row) => Object.assign(row, patch));
      return { data: null, error: null };
    }
    const out = rows.map(embed);
    return { data: limit === null ? out : out.slice(0, limit), error: null, count: rows.length };
  };

  const builder = {
    select(chosen = "*") {
      columns = chosen;
      return builder;
    },
    eq(key: string, value: unknown) {
      filters.push((row) => row[key] === value);
      return builder;
    },
    neq(key: string, value: unknown) {
      filters.push((row) => row[key] !== value);
      return builder;
    },
    is(key: string, value: unknown) {
      filters.push((row) => (row[key] ?? null) === value);
      return builder;
    },
    not(key: string) {
      filters.push((row) => (row[key] ?? null) !== null);
      return builder;
    },
    in(key: string, values: unknown[]) {
      filters.push((row) => values.includes(row[key]));
      return builder;
    },
    gt() {
      return builder;
    },
    order() {
      return builder;
    },
    limit(count: number) {
      limit = count;
      return builder;
    },
    insert(value: Row | Row[]) {
      mode = "insert";
      for (const one of Array.isArray(value) ? value : [value]) {
        (tables[table] ??= []).push({
          id: crypto.randomUUID(),
          ...(table === "devices" ? { status: "active", last_seen: new Date().toISOString() } : {}),
          ...one,
        });
      }
      return builder;
    },
    update(value: Row) {
      mode = "update";
      patch = value;
      return builder;
    },
    async maybeSingle() {
      const { data } = await run();
      return { data: (data as Row[] | null)?.[0] ?? null, error: null };
    },
    async single() {
      return builder.maybeSingle();
    },
    then(resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) {
      return run().then(resolve, reject);
    },
  };
  return builder;
}

const fakeDb = {
  from,
  auth: { admin: { getUserById: async () => ({ data: { user: { email: "" } } }) } },
  storage: { from: () => ({ download: async () => ({ data: null }) }) },
};

const audits: { action: string; detail: Row }[] = [];

vi.mock("server-only", () => ({}));
vi.mock("@/builder/db/server", () => ({ adminClient: () => fakeDb }));
vi.mock("@/builder/db/audit", () => ({
  audit: async (event: { action: string; detail: Row }) => void audits.push(event),
}));
vi.mock("@/builder/db/private-settings", () => ({
  getPrivateSettings: async () => ({
    trial_one_per_fingerprint: true,
    trial_one_per_phone: true,
    trial_require_fingerprint: true,
    trial_fingerprint_parts_to_match: 2,
    trial_similarity_percent: 80,
    device_releases_per_year: 2,
    clock_grace_days: 3,
    trial_summary_days: 7,
    activation_nearby_hours: 24,
  }),
}));
vi.mock("@/builder/db/settings", () => ({
  getPublicSettings: async () => ({ max_devices: 2, trial_days: 30, renewal_grace_days: 7, support_whatsapp: "22200000000" }),
}));
vi.mock("@/builder/licence/sign", () => ({ signingKeyIsSet: () => true }));
vi.mock("@/builder/licence/issue", () => ({ issueLicence: async () => "signed-licence" }));
vi.mock("@/builder/licence/setup", () => ({
  setupFor: async () => ({ configuration: {}, configurationVersion: 1, products: [], staff: [], logo: null }),
  serialFor: async () => "SERIAL",
}));
vi.mock("@/builder/payment/pay-help", () => ({ payHelpFor: () => ({}) }));
vi.mock("@/builder/licence/preview-test-shop", () => ({ previewTestShop: async () => null }));
vi.mock("@/builder/licence/activation-token", () => ({
  claimActivationToken: async () => ({ ok: false }),
  claimNearbyToken: async () => ({ ok: false, reason: "none" }),
  forgetPlace: async () => {},
  forgetDownloadsOf: async () => {},
  placeOfRequest: async () => null,
  releaseActivationToken: async () => {},
}));
vi.mock("@/builder/config-code/server", () => ({
  attemptKeys: async () => [],
  waitingFor: async () => 0,
  recordFailure: async () => 0,
  openByNumber: async () => ({ kind: "none" }),
  shopFor: async () => ({ ok: false }),
}));
vi.mock("@/builder/serial/serial", () => ({
  normaliseSerial: (serial: string) => serial,
  hashSerial: async (serial: string) => `hash:${serial}`,
}));
vi.mock("@/lib/rate-limit", () => ({ limitPerCaller: () => () => false }));

const { POST } = await import("@/app/api/licence/activate/route");
const { settleTrade } = await import("./trial-claim");
const { claimEnrolment, newEnrolment, passOf, TESTER_PASS_COOKIE } = await import("./tester-pass");

const MAC = { board: "b".repeat(64), disk: "d".repeat(64), machine: "m".repeat(64) };
const SHOP_PC = { board: "1".repeat(64), disk: "2".repeat(64), machine: "3".repeat(64) };
const phone = (n: number) => ({ board: null, disk: null, machine: String(n).repeat(64) });

function shop(id: string, pack: string, trialStarted: boolean) {
  tables.businesses.push({ id, owner_id: `owner-${id}`, name_latin: `Shop ${id}`, name_arabic: null, pack, receipt_address: null, banned_at: null, launch_client: false });
  tables.serials.push({ business_id: id, serial_hash: `hash:TESTSERIAL${id}` });
  const now = Date.now();
  tables.licences.push({
    id: `licence-${id}`,
    business_id: id,
    plan: "trial",
    status: "trial",
    starts_at: trialStarted ? new Date(now - 86_400_000).toISOString() : null,
    ends_at: trialStarted ? new Date(now + 20 * 86_400_000).toISOString() : null,
    renewal_secret: "x",
    grace_days: null,
  });
}

function device(businessId: string, deviceId: string, fingerprint: Row) {
  tables.devices.push({ id: crypto.randomUUID(), business_id: businessId, device_id: deviceId, role: "main", status: "active", fingerprint, last_seen: new Date().toISOString() });
}

function claim(businessId: string, packs: string[], fingerprint: { board: string | null; disk: string | null; machine: string | null }) {
  tables.trial_claims.push({
    id: crypto.randomUUID(),
    business_id: businessId,
    packs,
    fingerprint_board: fingerprint.board,
    fingerprint_disk: fingerprint.disk,
    fingerprint_machine: fingerprint.machine,
    phone: null,
    name: "",
    address: null,
  });
}

function markTester(fingerprint: Row, deviceId: string | null = null) {
  tables.tester_devices.push({ id: crypto.randomUUID(), label: "test", device_id: deviceId, fingerprint_board: fingerprint.board ?? null, fingerprint_disk: fingerprint.disk ?? null, fingerprint_machine: fingerprint.machine ?? null, removed_at: null });
}

async function activate(serial: string, deviceId: string, fingerprint: Row, platform = "mac", pass: string | null = null, via: "cookie" | "address" = "cookie") {
  const carried: Record<string, string> = !pass ? {} : via === "cookie" ? { cookie: `theme=dark; ${TESTER_PASS_COOKIE}=${pass}` } : { referer: `http://localhost/app/index.html?tp=${pass}` };
  const response = await POST(
    new Request("http://localhost/api/licence/activate", {
      method: "POST",
      headers: { "content-type": "application/json", ...carried },
      body: JSON.stringify({ serial, deviceId, platform, fingerprint }),
    })
  );
  return { status: response.status, body: (await response.json()) as Row };
}

beforeEach(() => {
  tables = { businesses: [], serials: [], licences: [], devices: [], trial_claims: [], trial_overrides: [], tester_devices: [], products_initial: [], logos: [], device_releases: [] };
  audits.length = 0;
  /* Adel's Mac already ran restaurant A's trial. */
  shop("A", "restaurant", true);
  device("A", "mac-folder-1", MAC);
  claim("A", ["restaurant"], MAC);
  shop("B", "restaurant", false);
});

describe("a test device installing shop after shop", () => {
  it("is refused a second restaurant trial while it is not marked, as today", async () => {
    const answer = await activate("TESTSERIALB", "mac-folder-2", MAC);
    expect(answer.status).toBe(403);
    expect(answer.body).toMatchObject({ error: "trial_not_available", because: "same_machine" });
  });

  it("is refused the same way when it reuses the very same device id", async () => {
    const answer = await activate("TESTSERIALB", "mac-folder-1", MAC);
    expect(answer.status).toBe(403);
  });

  it("gets the trial once marked, and leaves no marks in the claim", async () => {
    markTester(MAC);
    const answer = await activate("TESTSERIALB", "mac-folder-1", MAC);
    expect(answer.status).toBe(200);
    expect(answer.body.licence).toBe("signed-licence");

    const licence = tables.licences.find((one) => one.business_id === "B");
    expect(licence?.starts_at).toBeTruthy();
    const written = tables.trial_claims.find((one) => one.business_id === "B");
    expect(written?.packs).toEqual(["restaurant"]);
    /* Columns left out are null in the database. */
    for (const mark of ["fingerprint_board", "fingerprint_disk", "fingerprint_machine", "phone"]) {
      expect(written?.[mark] ?? null).toBeNull();
    }
    expect(audits.find((one) => one.action === "trial_started")?.detail).toMatchObject({ testerDevice: true });
  });

  it("is known after a reinstall changed one of its three parts", async () => {
    markTester(MAC);
    const answer = await activate("TESTSERIALB", "mac-folder-3", { ...MAC, machine: "z".repeat(64) });
    expect(answer.status).toBe(200);
  });

  it("knows a marked iPhone install by its one random number", async () => {
    device("A", "iphone-install-1", phone(7));
    claim("A", ["restaurant"], phone(7));
    expect((await activate("TESTSERIALB", "iphone-install-1", phone(7), "phone")).status).toBe(403);

    markTester(phone(7), "iphone-install-1");
    expect((await activate("TESTSERIALB", "iphone-install-1", phone(7), "phone")).status).toBe(200);
  });

  it("still refuses a customer's computer that had the trade's trial, with the list full", async () => {
    markTester(MAC);
    shop("C", "restaurant", true);
    device("C", "shop-pc", SHOP_PC);
    claim("C", ["restaurant"], SHOP_PC);
    const answer = await activate("TESTSERIALB", "shop-pc-2", SHOP_PC, "windows");
    expect(answer.status).toBe(403);
    expect(answer.body).toMatchObject({ because: "same_machine" });
  });
});

describe("a shop's device places", () => {
  beforeEach(() => {
    /* Shop A already holds its two places, neither of them a test device. */
    device("A", "shop-pc", SHOP_PC);
  });

  it("refuses a third computer, as today", async () => {
    const answer = await activate("TESTSERIALA", "another-pc", { board: "4".repeat(64), disk: "5".repeat(64), machine: "6".repeat(64) }, "windows");
    expect(answer.status).toBe(409);
    expect(answer.body).toMatchObject({ error: "device_limit" });
  });

  it("lets a test device in past the limit", async () => {
    markTester(phone(9));
    const answer = await activate("TESTSERIALA", "iphone-install-2", phone(9), "phone");
    expect(answer.status).toBe(200);
  });

  it("does not count a test device already there against the shop", async () => {
    markTester(MAC);
    const answer = await activate("TESTSERIALA", "another-pc", { board: "4".repeat(64), disk: "5".repeat(64), machine: "6".repeat(64) }, "windows");
    expect(answer.status).toBe(200);
  });
});

describe("a test shop rebuilt as another trade during its trial", () => {
  beforeEach(() => {
    /* Shop A's Mac also ran a pharmacy trial elsewhere. */
    shop("P", "pharmacy", true);
    device("P", "mac-folder-9", MAC);
    claim("P", ["pharmacy"], MAC);
  });

  it("ends the trial on an unmarked device, as today", async () => {
    expect(await settleTrade(fakeDb as never, "A", "pharmacy")).toBe("ended");
  });

  it("keeps it running on a test device", async () => {
    markTester(MAC);
    expect(await settleTrade(fakeDb as never, "A", "pharmacy")).toBe("added");
    const licence = tables.licences.find((one) => one.business_id === "A");
    expect(new Date(licence?.ends_at as string).getTime()).toBeGreaterThan(Date.now());
    expect(tables.trial_claims.find((one) => one.business_id === "A")?.packs).toEqual(["restaurant", "pharmacy"]);
  });
});

describe("an iPhone made a test device by scanning a QR code", () => {
  it("swaps the code for a pass once, and never after its minutes", async () => {
    const made = await newEnrolment(fakeDb as never, "Mon iPhone", "staff-1");
    expect(made).not.toBeNull();
    const late = new Date(Date.now() + 16 * 60_000);
    expect(await claimEnrolment(fakeDb as never, made!.code, late)).toBeNull();

    const first = await claimEnrolment(fakeDb as never, made!.code);
    expect(first?.pass).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(first?.label).toBe("Mon iPhone");
    expect(await claimEnrolment(fakeDb as never, made!.code)).toBeNull();

    /* Only hashes are kept. */
    const row = tables.tester_devices[0];
    expect(JSON.stringify(row)).not.toContain(made!.code);
    expect(JSON.stringify(row)).not.toContain(first!.pass);
    expect(row.enrol_hash).toBeNull();
  });

  it("reads the pass among the request's other cookies, and nothing else", () => {
    const request = (cookie: string) => new Request("http://localhost/", { headers: { cookie } });
    const pass = "a".repeat(43);
    expect(passOf(request(`theme=dark; ${TESTER_PASS_COOKIE}=${pass}; lang=fr`))).toBe(pass);
    expect(passOf(request("theme=dark"))).toBeNull();
    expect(passOf(request(`${TESTER_PASS_COOKIE}=short`))).toBeNull();
  });

  it("lets every new shop icon in with the pass Safari handed it, and writes the install down", async () => {
    device("A", "shop-pc", SHOP_PC);
    const made = await newEnrolment(fakeDb as never, "Mon iPhone", "staff-1");
    const { pass } = (await claimEnrolment(fakeDb as never, made!.code))!;

    /* A fresh home-screen icon: a number nobody has seen, on a shop with both places taken. */
    expect((await activate("TESTSERIALA", "home-icon-1", phone(4), "phone")).status).toBe(409);
    expect((await activate("TESTSERIALA", "home-icon-1", phone(4), "phone", "b".repeat(43))).status).toBe(409);
    expect((await activate("TESTSERIALA", "home-icon-1", phone(4), "phone", pass)).status).toBe(200);

    const holder = tables.tester_devices.find((one) => one.pass_hash);
    const install = tables.tester_devices.find((one) => one.device_id === "home-icon-1");
    expect(install).toMatchObject({ via: holder?.id, fingerprint_machine: phone(4).machine });
  });

  it("gives a second trial of the same trade to an icon carrying the pass", async () => {
    const made = await newEnrolment(fakeDb as never, "Mon iPhone", "staff-1");
    const { pass } = (await claimEnrolment(fakeDb as never, made!.code))!;
    /* The icon that ran restaurant A, kept, now opening restaurant B. */
    device("A", "home-icon-2", phone(5));
    expect((await activate("TESTSERIALB", "home-icon-2", phone(5), "phone")).status).toBe(403);
    expect((await activate("TESTSERIALB", "home-icon-2", phone(5), "phone", pass)).status).toBe(200);
  });

  it("is recognised from the icon's address when the icon got no cookie, as on Adel's iPhone", async () => {
    device("A", "shop-pc", SHOP_PC);
    const made = await newEnrolment(fakeDb as never, "Mon iPhone", "staff-1");
    const { pass } = (await claimEnrolment(fakeDb as never, made!.code))!;
    expect((await activate("TESTSERIALA", "home-icon-4", phone(8), "phone", null)).status).toBe(409);
    expect((await activate("TESTSERIALA", "home-icon-4", phone(8), "phone", pass, "address")).status).toBe(200);
  });

  it("stops working once the iPhone is removed", async () => {
    device("A", "shop-pc", SHOP_PC);
    const made = await newEnrolment(fakeDb as never, "Mon iPhone", "staff-1");
    const { pass } = (await claimEnrolment(fakeDb as never, made!.code))!;
    for (const row of tables.tester_devices) row.removed_at = new Date().toISOString();
    expect((await activate("TESTSERIALA", "home-icon-3", phone(6), "phone", pass)).status).toBe(409);
  });
});
