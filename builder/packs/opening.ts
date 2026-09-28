import { packs, type Pack } from "@/app-ui/packs";

/*
 * Which trades owners can choose. The one place to change it.
 *
 *   "open"   every visitor can choose it: the home page, its own page and
 *            the builder all offer it.
 *   "test"   only a browser in test mode (the link in the admin area's
 *            Réglages) can choose it. Everybody else sees "Bientôt".
 *
 * A trade becomes "open" once Adel has tried it in test mode and approved
 * it, and not before. Changing a word below is the whole change: every page
 * reads this, and nothing else decides it. All eight opened on 2026-09-25,
 * on Adel's word that the apps are ready.
 */
export const OPENING: Record<Pack, "open" | "test"> = {
  pharmacy: "open",
  shop: "open",
  restaurant: "open",
  bakery: "open",
  warehouse: "open",
  hotel: "open",
  transport: "open",
  general: "open",
};

/** The trades every visitor can choose. */
export function openPacks(): Pack[] {
  return packs.filter((pack) => OPENING[pack] === "open");
}

/** The trades a browser can choose: the open ones, and in test mode all of them. */
export function choosablePacks(tester: boolean): Pack[] {
  return packs.filter((pack) => OPENING[pack] === "open" || (tester && OPENING[pack] === "test"));
}
