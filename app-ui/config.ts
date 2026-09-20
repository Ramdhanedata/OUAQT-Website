import { z } from "zod";
import { packs, type Pack } from "./packs";

/*
 * The configuration one shop's software runs on.
 *
 * This file is the border between the builder and the app. The builder writes
 * a configuration, the screens in this folder read one, and the desktop app
 * will read the same shape. Nothing else crosses.
 *
 * It is versioned. A shop already running keeps its version until it is
 * migrated on purpose, so a change here never reaches a till by surprise.
 */

export { packs, type Pack };

export const appLanguages = ["fr", "ar", "en"] as const;
export type AppLanguage = (typeof appLanguages)[number];

/*
 * Images live as data URLs while the owner is still building, and as storage
 * paths once saved. Both are strings, so the screens do not care which.
 */
const image = z.string().max(2_000_000).optional();

export const businessSchema = z.object({
  /** Shown on the receipt and at the top of the sale screen. */
  nameLatin: z.string().trim().min(1).max(60),
  /** Optional second name in Arabic script, shown under the Latin one. */
  nameArabic: z.string().trim().max(60).optional(),
  phone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(120).optional(),
  /** The colour logo, for the screen. */
  logo: image,
  /** The black and white one, for the thermal printer. */
  logoMono: image,
});

/*
 * What every shop answers, whatever it sells.
 *
 * These are the owner's own words turned into switches: who takes the money,
 * when the till is counted, whether he sells on credit. Nothing here is a
 * price or a limit; those live in settings.
 */
export const commonFeatures = z.object({
  /** Computers the software will run on. The licence decides the ceiling. */
  devices: z.number().int().min(1),
  cashiers: z.enum(["owner", "owner_and_staff"]),
  cashClose: z.enum(["daily", "per_shift"]),
  credit: z.object({
    enabled: z.boolean(),
    limitPerCustomer: z.boolean(),
  }),
  printedReceipt: z.boolean(),
  lowStockAlert: z.boolean(),
  discounts: z.boolean(),
});

export const pharmacyFeatures = z.object({
  /** Selling a strip or a single tablet rather than the whole box. */
  unitSale: z.boolean(),
  trackExpiry: z.boolean(),
  expiryAlertMonths: z.number().int().positive(),
  batchNumbers: z.boolean(),
  trackSuppliers: z.boolean(),
  search: z.array(z.enum(["name", "barcode"])).min(1),
});

export const packFeatures = z.object({
  pharmacy: pharmacyFeatures.optional(),
});

export const configurationSchema = z.object({
  version: z.literal(1),
  pack: z.enum(packs),
  business: businessSchema,
  language: z.object({
    /** The language the owner answered in. */
    builder: z.enum(appLanguages),
    /** The language his staff will see every day. */
    app: z.enum(appLanguages),
  }),
  receipt: z.object({
    showLogo: z.boolean(),
    showPhone: z.boolean(),
    showAddress: z.boolean(),
    /** A line of thanks at the bottom, in the app's language. */
    footer: z.string().trim().max(80).optional(),
  }),
  common: commonFeatures,
  features: packFeatures,
});

export type Configuration = z.infer<typeof configurationSchema>;
export type Business = z.infer<typeof businessSchema>;
export type CommonFeatures = z.infer<typeof commonFeatures>;
export type PharmacyFeatures = z.infer<typeof pharmacyFeatures>;

/*
 * The configuration an owner has when he has answered nothing at all.
 *
 * Every question in the interview offers "Je ne sais pas", so a complete set
 * of defaults has to produce software that works. This is the floor that
 * guarantees it, and a test walks it.
 */
export function defaultConfiguration(
  pack: Pack,
  language: AppLanguage
): Configuration {
  return {
    version: 1,
    pack,
    business: { nameLatin: "" },
    language: { builder: language, app: language },
    receipt: { showLogo: true, showPhone: true, showAddress: true },
    common: {
      devices: 1,
      cashiers: "owner",
      cashClose: "daily",
      credit: { enabled: true, limitPerCustomer: false },
      printedReceipt: true,
      lowStockAlert: true,
      discounts: false,
    },
    features:
      pack === "pharmacy"
        ? {
            pharmacy: {
              unitSale: true,
              trackExpiry: true,
              expiryAlertMonths: 3, // not-a-rule: the question's own default, and the owner can change it
              batchNumbers: true,
              trackSuppliers: true,
              search: ["name"],
            },
          }
        : {},
  };
}
