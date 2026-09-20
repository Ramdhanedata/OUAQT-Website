/*
 * The business types the app knows about.
 *
 * Their own file, with nothing imported, because the builder's first screen
 * lists them and that screen should not have to download a validation
 * library to print four words.
 */
export const packs = ["pharmacy", "bakery", "restaurant", "warehouse"] as const;
export type Pack = (typeof packs)[number];
