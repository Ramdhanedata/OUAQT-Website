import "server-only";

import { defaultConfiguration } from "@/app-ui/config";
import { packs, type Pack } from "@/app-ui/packs";
import { sampleProducts } from "@/app-ui/sample-data";
import { newDeviceToken } from "./devices";
import { issueLicence } from "./issue";

/*
 * Trying the phone app on a preview, with no serial to issue and no database.
 *
 * The link /app/index.html#serial=TESTSHOP opens an invented shop of that
 * trade, down the same activation path a real shop takes: a signed licence,
 * a configuration the app checks with its own schema, and products in its
 * own database. So what is being tried is the software, not a stand-in.
 *
 * Three things keep this away from anything real. It answers on Vercel
 * preview deployments only, so www.ouaqt.com never takes this path. It
 * answers the phone app only. And the licence is signed with the preview's
 * test key, which a production build refuses. Nothing here reads or writes
 * the database, so no shop, serial or trial is touched.
 *
 * not-a-rule-file: an invented shop's numbers, never sold and never charged.
 */

const PREFIX = "TEST";
const TEST_BUSINESS_ID = "00000000-0000-4000-8000-000000000001";
const TEST_DAYS = 30;
const MS_IN_A_DAY = 86_400_000;

/** The trade a test code names: TESTSHOP, TESTPHARMACY, or null when it names none. */
export function testShopPack(serial: string | undefined): Pack | null {
  const wanted = (serial ?? "").trim().toUpperCase();
  if (!wanted.startsWith(PREFIX)) return null;
  return packs.find((pack) => pack.toUpperCase() === wanted.slice(PREFIX.length)) ?? null;
}

/** The activation answer for a test shop, or null when this request is not one. */
export async function previewTestShop(input: {
  serial?: string;
  deviceId: string;
  platform: string;
  fingerprint?: { board?: string | null; disk?: string | null; machine?: string | null };
}) {
  if (process.env.VERCEL_ENV !== "preview" || input.platform !== "phone") return null;
  const pack = testShopPack(input.serial);
  if (!pack) return null;

  const now = new Date();
  const businessName = "Commerce d'essai";
  const base = defaultConfiguration(pack, "fr");

  const licence = await issueLicence({
    businessId: TEST_BUSINESS_ID,
    businessName,
    licence: {
      plan: "trial",
      status: "trial",
      startsAt: now.toISOString(),
      endsAt: new Date(now.getTime() + TEST_DAYS * MS_IN_A_DAY).toISOString(),
      updatesUntil: null,
      renewalSecret: "",
    },
    devices: [
      {
        device_id: input.deviceId,
        role: "main",
        fingerprint: {
          board: input.fingerprint?.board ?? null,
          disk: input.fingerprint?.disk ?? null,
          machine: input.fingerprint?.machine ?? null,
        },
      },
    ],
    rules: {
      maxDevices: 2,
      renewalGraceDays: 7,
      clockGraceDays: 3,
      deviceReleasesPerYear: 2,
      machinePartsToMatch: 2,
      trialSummaryDays: 5,
    },
    now,
  });

  return {
    licence,
    serial: `${PREFIX}${pack.toUpperCase()}`,
    deviceToken: newDeviceToken(),
    configuration: { ...base, business: { ...base.business, nameLatin: businessName } },
    configurationVersion: 1,
    products: sampleProducts(pack).map((product) => ({
      name: product.name.fr,
      price: product.price,
      quantity: product.inStock,
    })),
    staff: [],
    logo: null,
    supportWhatsapp: null,
  };
}
