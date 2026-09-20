import type { AppLanguage } from "./config";
import type { Pack } from "./packs";

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

/*
 * The pack screens need sample rows too, and their sizes come from the
 * configuration rather than from here: a room of two hundred tables draws two
 * hundred tables. That is the point of showing him the screen at all.
 */

export function sampleTables(count: number): { number: number; total: number | null }[] {
  return Array.from({ length: Math.max(0, count) }, (_, index) => {
    const number = index + 1;
    /* Every third table busy, so the screen shows both states at any size. */
    const busy = number % 3 === 0;
    return { number, total: busy ? 250 + (number % 7) * 100 : null };
  });
}

export function sampleProduction(pack: Pack): { product: SampleProduct; made: number; sold: number }[] {
  return byPack[pack].slice(0, 4).map((product, index) => ({
    product,
    made: 60 + index * 20,
    sold: 20 + index * 15,
  }));
}

export function samplePreorders(language: AppLanguage): {
  id: string;
  customer: string;
  items: string;
  dueAt: string;
  deposit: number | null;
}[] {
  const words = {
    fr: { one: "2 gâteaux", two: "20 baguettes", at: "11:00", late: "17:00" },
    ar: { one: "كعكتان", two: "20 باغيت", at: "11:00", late: "17:00" },
    en: { one: "2 cakes", two: "20 baguettes", at: "11:00", late: "17:00" },
  }[language];

  return [
    { id: "o1", customer: "Fatimetou", items: words.one, dueAt: words.at, deposit: 500 },
    { id: "o2", customer: "Mohamed", items: words.two, dueAt: words.late, deposit: null },
  ];
}

export function sampleLocations(count: number, language: AppLanguage): string[] {
  const word = { fr: "Dépôt", ar: "مستودع", en: "Store" }[language];
  return Array.from({ length: Math.max(1, count) }, (_, index) => `${word} ${index + 1}`);
}

export function sampleMovements(
  locations: string[],
  language: AppLanguage
): {
  id: string;
  direction: "in" | "out";
  product: string;
  quantity: number;
  unit: string;
  party: string;
  location: string;
  at: string;
}[] {
  const words = {
    fr: { supplier: "Fournisseur Nord", customer: "Client Sud", case: "cartons", bag: "sacs" },
    ar: { supplier: "المورّد الشمالي", customer: "زبون الجنوب", case: "كراتين", bag: "أكياس" },
    en: { supplier: "North supplier", customer: "South customer", case: "cases", bag: "bags" },
  }[language];

  const products = byPack.warehouse;
  return [
    {
      id: "m1",
      direction: "in" as const,
      product: products[0].name[language],
      quantity: 40,
      unit: words.bag,
      party: words.supplier,
      location: locations[0],
      at: "08:15",
    },
    {
      id: "m2",
      direction: "out" as const,
      product: products[1].name[language],
      quantity: 12,
      unit: words.case,
      party: words.customer,
      location: locations[locations.length - 1],
      at: "10:40",
    },
  ];
}

/** A short sample sale, so the receipt is never shown empty. */
export function sampleSale(pack: Pack): { product: SampleProduct; quantity: number }[] {
  const products = byPack[pack];
  return [
    { product: products[0], quantity: 2 },
    { product: products[2], quantity: 1 },
  ];
}
