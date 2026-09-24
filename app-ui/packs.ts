/*
 * The business types the app knows about.
 *
 * Their own file, with nothing imported, because the builder's first screen
 * lists them and that screen should not have to download a validation
 * library to print eight words.
 *
 * The order is the order the builder offers them in: the counters first,
 * then the trades with rooms, trips and places, and last the one for any
 * business that is none of these.
 */
export const packs = [
  "pharmacy",
  "shop",
  "restaurant",
  "bakery",
  "warehouse",
  "hotel",
  "transport",
  "general",
] as const;
export type Pack = (typeof packs)[number];
