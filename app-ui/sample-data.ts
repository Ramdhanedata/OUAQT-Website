import type { AppLanguage, Pack } from "./config";

/*
 * What the preview shows before the owner has imported anything of his own.
 *
 * Every line here is invented. Nothing comes from a real shop, a real client
 * or a screenshot of one, which is a rule in docs/UI_RULES.md rather than a
 * preference.
 *
 * The pharmacy list deliberately holds no medicine names, no dosages and no
 * brands: it lists the everyday counter items instead, so nothing on this
 * screen can be read as advice about a medicine.
 *
 * The prices below are invented too, and are never charged to anyone, so this
 * file is marked not-a-rule-file for the constants guard.
 */

export type SampleProduct = {
  id: string;
  name: Record<AppLanguage, string>;
  price: number;
  inStock: number;
};

const pharmacy: SampleProduct[] = [
  { id: "p1", name: { fr: "Savon antiseptique", ar: "صابون مطهر", en: "Antiseptic soap" }, price: 120, inStock: 24 },
  { id: "p2", name: { fr: "Pansements, boîte", ar: "علبة لصقات", en: "Plasters, box" }, price: 250, inStock: 12 },
  { id: "p3", name: { fr: "Gants, boîte", ar: "علبة قفازات", en: "Gloves, box" }, price: 400, inStock: 8 },
  { id: "p4", name: { fr: "Thermomètre", ar: "ميزان حرارة", en: "Thermometer" }, price: 900, inStock: 5 },
  { id: "p5", name: { fr: "Coton hydrophile", ar: "قطن طبي", en: "Cotton wool" }, price: 150, inStock: 30 },
  { id: "p6", name: { fr: "Masques, paquet", ar: "كمامات، علبة", en: "Masks, pack" }, price: 200, inStock: 40 },
];

const bakery: SampleProduct[] = [
  { id: "b1", name: { fr: "Pain", ar: "خبز", en: "Bread" }, price: 20, inStock: 200 },
  { id: "b2", name: { fr: "Baguette", ar: "باغيت", en: "Baguette" }, price: 25, inStock: 150 },
  { id: "b3", name: { fr: "Croissant", ar: "كرواسون", en: "Croissant" }, price: 50, inStock: 60 },
  { id: "b4", name: { fr: "Gâteau, part", ar: "قطعة كعك", en: "Cake, slice" }, price: 150, inStock: 20 },
  { id: "b5", name: { fr: "Jus", ar: "عصير", en: "Juice" }, price: 100, inStock: 48 },
  { id: "b6", name: { fr: "Biscuits, sachet", ar: "كيس بسكويت", en: "Biscuits, bag" }, price: 80, inStock: 35 },
];

const restaurant: SampleProduct[] = [
  { id: "r1", name: { fr: "Thé", ar: "شاي", en: "Tea" }, price: 50, inStock: 0 },
  { id: "r2", name: { fr: "Café", ar: "قهوة", en: "Coffee" }, price: 80, inStock: 0 },
  { id: "r3", name: { fr: "Sandwich", ar: "سندويتش", en: "Sandwich" }, price: 250, inStock: 0 },
  { id: "r4", name: { fr: "Poulet, portion", ar: "حصة دجاج", en: "Chicken, portion" }, price: 700, inStock: 0 },
  { id: "r5", name: { fr: "Riz au poisson", ar: "أرز بالسمك", en: "Rice with fish" }, price: 600, inStock: 0 },
  { id: "r6", name: { fr: "Bouteille d'eau", ar: "قارورة ماء", en: "Bottle of water" }, price: 40, inStock: 0 },
];

const warehouse: SampleProduct[] = [
  { id: "w1", name: { fr: "Sac de riz, 50 kg", ar: "كيس أرز، 50 كغ", en: "Rice, 50 kg bag" }, price: 12000, inStock: 60 },
  { id: "w2", name: { fr: "Carton d'huile", ar: "كرتون زيت", en: "Oil, case" }, price: 9000, inStock: 45 },
  { id: "w3", name: { fr: "Sac de sucre, 25 kg", ar: "كيس سكر، 25 كغ", en: "Sugar, 25 kg bag" }, price: 7500, inStock: 80 },
  { id: "w4", name: { fr: "Carton de lait", ar: "كرتون حليب", en: "Milk, case" }, price: 6500, inStock: 30 },
  { id: "w5", name: { fr: "Sac de farine, 50 kg", ar: "كيس دقيق، 50 كغ", en: "Flour, 50 kg bag" }, price: 11000, inStock: 25 },
  { id: "w6", name: { fr: "Carton de savon", ar: "كرتون صابون", en: "Soap, case" }, price: 4800, inStock: 52 },
];

const byPack: Record<Pack, SampleProduct[]> = {
  pharmacy,
  bakery,
  restaurant,
  warehouse,
};

export function sampleProducts(pack: Pack): SampleProduct[] {
  return byPack[pack];
}

/** A short sample sale, so the receipt is never shown empty. */
export function sampleSale(pack: Pack): { product: SampleProduct; quantity: number }[] {
  const products = byPack[pack];
  return [
    { product: products[0], quantity: 2 },
    { product: products[2], quantity: 1 },
  ];
}
