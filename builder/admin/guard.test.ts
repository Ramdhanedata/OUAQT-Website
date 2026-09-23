import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/builder/db/server", () => ({ sessionClient: () => null, adminClient: () => null }));

const TEST_URL = "https://vpdbkhykiylhigkwacvp.supabase.co";
const saved = { ...process.env };

afterEach(() => {
  process.env = { ...saved };
});

async function openWith(vercelEnv: string | undefined, url: string) {
  if (vercelEnv === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = vercelEnv;
  process.env.NEXT_PUBLIC_SUPABASE_URL = url;
  const { adminOpenForTesting } = await import("./guard");
  return adminOpenForTesting();
}

describe("the admin area opens without a login only where it cannot hurt", () => {
  it("opens on a preview of the test project", async () => {
    expect(await openWith("preview", TEST_URL)).toBe(true);
  });

  it("opens on a developer's machine against the test project", async () => {
    expect(await openWith(undefined, TEST_URL)).toBe(true);
  });

  it("stays locked in production, even against the test project", async () => {
    expect(await openWith("production", TEST_URL)).toBe(false);
  });

  it("stays locked on a preview pointed at any other database", async () => {
    expect(await openWith("preview", "https://abcdefghijklmnop.supabase.co")).toBe(false);
  });

  it("is not fooled by the test project's name inside another address", async () => {
    expect(await openWith("preview", "https://evil.example/vpdbkhykiylhigkwacvp.supabase.co")).toBe(false);
  });
});
