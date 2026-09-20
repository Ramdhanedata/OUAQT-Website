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

export const bakeryFeatures = z.object({
  /** By the piece, by weight, or both: a baker often does both. */
  sellBy: z.array(z.enum(["piece", "weight"])).min(1),
  trackProduction: z.boolean(),
  preorders: z.boolean(),
  deposit: z.boolean(),
  /** What happens to what is left at closing. */
  unsold: z.enum(["loss", "resell", "untracked"]),
});

export const restaurantFeatures = z.object({
  service: z.array(z.enum(["dine_in", "takeaway", "delivery"])).min(1),
  /*
   * How many tables the room has. The ceiling is the question's own, not a
   * commercial limit: two hundred is more tables than any room we have seen,
   * and the screen has to stay usable at that number.
   */
  tables: z.number().int().min(1).max(200),
  kitchen: z.enum(["screen", "printed", "spoken"]),
  payWhen: z.enum(["before", "after"]),
  options: z.boolean(),
});

export const warehouseFeatures = z.object({
  locations: z.number().int().min(1).max(20),
  recordEntries: z.boolean(),
  destinations: z.array(z.enum(["customers", "my_shops", "sites"])).min(1),
  units: z.array(z.enum(["piece", "case", "kilo", "litre"])).min(1),
  sellsDirect: z.boolean(),
});

export const packFeatures = z.object({
  pharmacy: pharmacyFeatures.optional(),
  bakery: bakeryFeatures.optional(),
  restaurant: restaurantFeatures.optional(),
  warehouse: warehouseFeatures.optional(),
});

const configurationShape = z.object({
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

/*
 * The configuration, with one rule the shape alone cannot express: the pack a
 * shop chose is the pack whose features it carries, and no other.
 *
 * Without this, a bakery configuration with a pharmacy block validates
 * happily and the desktop app would go looking for expiry dates in a shop
 * that sells bread. A bakery with no bakery block at all is the same problem
 * from the other side: nothing says what its software should do.
 */
export const configurationSchema = configurationShape.superRefine(
  (configuration, context) => {
    const carried = Object.keys(configuration.features);

    if (!carried.includes(configuration.pack)) {
      context.addIssue({
        code: "custom",
        path: ["features", configuration.pack],
        message: `a ${configuration.pack} configuration must carry its ${configuration.pack} features`,
      });
    }

    for (const other of carried) {
      if (other !== configuration.pack) {
        context.addIssue({
          code: "custom",
          path: ["features", other],
          message: `a ${configuration.pack} configuration must not carry ${other} features`,
        });
      }
    }
  }
);

export type Configuration = z.infer<typeof configurationSchema>;
export type Business = z.infer<typeof businessSchema>;
export type CommonFeatures = z.infer<typeof commonFeatures>;
export type PharmacyFeatures = z.infer<typeof pharmacyFeatures>;
export type BakeryFeatures = z.infer<typeof bakeryFeatures>;
export type RestaurantFeatures = z.infer<typeof restaurantFeatures>;
export type WarehouseFeatures = z.infer<typeof warehouseFeatures>;

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
    /*
     * Each pack's own floor, taken from the defaults in its question bank.
     * Only the pack he chose is present: a bakery configuration carrying an
     * empty pharmacy block would be a lie about what his software does.
     */
    features: featureDefaults(pack),
  };
}

function featureDefaults(pack: Pack): z.infer<typeof packFeatures> {
  switch (pack) {
    case "pharmacy":
      return {
        pharmacy: {
          unitSale: true,
          trackExpiry: true,
          expiryAlertMonths: 3, // not-a-rule: the question's own default, and the owner can change it
          batchNumbers: true,
          trackSuppliers: true,
          search: ["name"],
        },
      };
    case "bakery":
      return {
        bakery: {
          sellBy: ["piece"],
          trackProduction: true,
          preorders: true,
          deposit: true,
          unsold: "loss",
        },
      };
    case "restaurant":
      return {
        restaurant: {
          service: ["dine_in", "takeaway"],
          tables: 10, // not-a-rule: the question's own default
          kitchen: "printed",
          payWhen: "after",
          options: false,
        },
      };
    case "warehouse":
      return {
        warehouse: {
          locations: 1,
          recordEntries: true,
          destinations: ["customers"],
          units: ["piece", "case"],
          sellsDirect: false,
        },
      };
  }
}
