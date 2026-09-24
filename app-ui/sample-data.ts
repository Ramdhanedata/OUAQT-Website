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
 * file is marked not-a-rule-file for the constants guard. They are written in
 * the smallest unit like every other amount: 12000 is 120 MRU.
 */

export type SampleProduct = {
  id: string;
  name: Record<AppLanguage, string>;
  price: number;
  inStock: number;
};

const pharmacy: SampleProduct[] = [
  { id: "p1", name: { fr: "Savon antiseptique", ar: "صابون مطهر", en: "Antiseptic soap" }, price: 12000, inStock: 24 },
  { id: "p2", name: { fr: "Pansements, boîte", ar: "علبة لصقات", en: "Plasters, box" }, price: 25000, inStock: 12 },
  { id: "p3", name: { fr: "Gants, boîte", ar: "علبة قفازات", en: "Gloves, box" }, price: 40000, inStock: 8 },
  { id: "p4", name: { fr: "Thermomètre", ar: "ميزان حرارة", en: "Thermometer" }, price: 90000, inStock: 5 },
  { id: "p5", name: { fr: "Coton hydrophile", ar: "قطن طبي", en: "Cotton wool" }, price: 15000, inStock: 30 },
  { id: "p6", name: { fr: "Masques, paquet", ar: "كمامات، علبة", en: "Masks, pack" }, price: 20000, inStock: 40 },
];

const bakery: SampleProduct[] = [
  { id: "b1", name: { fr: "Pain", ar: "خبز", en: "Bread" }, price: 2000, inStock: 200 },
  { id: "b2", name: { fr: "Baguette", ar: "باغيت", en: "Baguette" }, price: 2500, inStock: 150 },
  { id: "b3", name: { fr: "Croissant", ar: "كرواسون", en: "Croissant" }, price: 5000, inStock: 60 },
  { id: "b4", name: { fr: "Gâteau, part", ar: "قطعة كعك", en: "Cake, slice" }, price: 15000, inStock: 20 },
  { id: "b5", name: { fr: "Jus", ar: "عصير", en: "Juice" }, price: 10000, inStock: 48 },
  { id: "b6", name: { fr: "Biscuits, sachet", ar: "كيس بسكويت", en: "Biscuits, bag" }, price: 8000, inStock: 35 },
];

const restaurant: SampleProduct[] = [
  { id: "r1", name: { fr: "Thé", ar: "شاي", en: "Tea" }, price: 5000, inStock: 0 },
  { id: "r2", name: { fr: "Café", ar: "قهوة", en: "Coffee" }, price: 8000, inStock: 0 },
  { id: "r3", name: { fr: "Sandwich", ar: "سندويتش", en: "Sandwich" }, price: 25000, inStock: 0 },
  { id: "r4", name: { fr: "Poulet, portion", ar: "حصة دجاج", en: "Chicken, portion" }, price: 70000, inStock: 0 },
  { id: "r5", name: { fr: "Riz au poisson", ar: "أرز بالسمك", en: "Rice with fish" }, price: 60000, inStock: 0 },
  { id: "r6", name: { fr: "Bouteille d'eau", ar: "قارورة ماء", en: "Bottle of water" }, price: 4000, inStock: 0 },
];

const warehouse: SampleProduct[] = [
  { id: "w1", name: { fr: "Sac de riz, 50 kg", ar: "كيس أرز، 50 كغ", en: "Rice, 50 kg bag" }, price: 1200000, inStock: 60 },
  { id: "w2", name: { fr: "Carton d'huile", ar: "كرتون زيت", en: "Oil, case" }, price: 900000, inStock: 45 },
  { id: "w3", name: { fr: "Sac de sucre, 25 kg", ar: "كيس سكر، 25 كغ", en: "Sugar, 25 kg bag" }, price: 750000, inStock: 80 },
  { id: "w4", name: { fr: "Carton de lait", ar: "كرتون حليب", en: "Milk, case" }, price: 650000, inStock: 30 },
  { id: "w5", name: { fr: "Sac de farine, 50 kg", ar: "كيس دقيق، 50 كغ", en: "Flour, 50 kg bag" }, price: 1100000, inStock: 25 },
  { id: "w6", name: { fr: "Carton de savon", ar: "كرتون صابون", en: "Soap, case" }, price: 480000, inStock: 52 },
];

const shop: SampleProduct[] = [
  { id: "s1", name: { fr: "Lait en poudre", ar: "حليب مجفف", en: "Powdered milk" }, price: 18000, inStock: 24 },
  { id: "s2", name: { fr: "Sucre, 1 kg", ar: "سكر، 1 كغ", en: "Sugar, 1 kg" }, price: 4500, inStock: 50 },
  { id: "s3", name: { fr: "Huile, 1 litre", ar: "زيت، 1 لتر", en: "Oil, 1 litre" }, price: 9000, inStock: 36 },
  { id: "s4", name: { fr: "Thé vert, paquet", ar: "شاي أخضر، علبة", en: "Green tea, pack" }, price: 12000, inStock: 40 },
  { id: "s5", name: { fr: "Savon", ar: "صابون", en: "Soap" }, price: 3000, inStock: 60 },
  { id: "s6", name: { fr: "Recharge téléphone", ar: "تعبئة رصيد", en: "Phone top-up" }, price: 10000, inStock: 100 },
];

const hotel: SampleProduct[] = [
  { id: "h1", name: { fr: "Nuit, chambre double", ar: "ليلة، غرفة مزدوجة", en: "Night, double room" }, price: 250000, inStock: 0 },
  { id: "h2", name: { fr: "Petit-déjeuner", ar: "فطور", en: "Breakfast" }, price: 25000, inStock: 0 },
  { id: "h3", name: { fr: "Blanchisserie", ar: "غسيل", en: "Laundry" }, price: 20000, inStock: 0 },
  { id: "h4", name: { fr: "Eau minérale", ar: "ماء معدني", en: "Mineral water" }, price: 5000, inStock: 48 },
  { id: "h5", name: { fr: "Dîner", ar: "عشاء", en: "Dinner" }, price: 60000, inStock: 0 },
  { id: "h6", name: { fr: "Navette aéroport", ar: "نقل إلى المطار", en: "Airport shuttle" }, price: 80000, inStock: 0 },
];

const transport: SampleProduct[] = [
  { id: "t1", name: { fr: "Nouakchott → Nouadhibou", ar: "نواكشوط ← نواذيبو", en: "Nouakchott → Nouadhibou" }, price: 80000, inStock: 0 },
  { id: "t2", name: { fr: "Nouakchott → Rosso", ar: "نواكشوط ← روصو", en: "Nouakchott → Rosso" }, price: 30000, inStock: 0 },
  { id: "t3", name: { fr: "Nouakchott → Kiffa", ar: "نواكشوط ← كيفه", en: "Nouakchott → Kiffa" }, price: 70000, inStock: 0 },
  { id: "t4", name: { fr: "Colis, petit", ar: "طرد صغير", en: "Parcel, small" }, price: 10000, inStock: 0 },
  { id: "t5", name: { fr: "Colis, grand", ar: "طرد كبير", en: "Parcel, large" }, price: 25000, inStock: 0 },
  { id: "t6", name: { fr: "Bagage en plus", ar: "أمتعة إضافية", en: "Extra luggage" }, price: 10000, inStock: 0 },
];

const general: SampleProduct[] = [
  { id: "g1", name: { fr: "Coupe de cheveux", ar: "قص الشعر", en: "Haircut" }, price: 30000, inStock: 0 },
  { id: "g2", name: { fr: "Réparation", ar: "إصلاح", en: "Repair" }, price: 50000, inStock: 0 },
  { id: "g3", name: { fr: "Shampooing", ar: "شامبو", en: "Shampoo" }, price: 25000, inStock: 12 },
  { id: "g4", name: { fr: "Photocopie", ar: "نسخة", en: "Photocopy" }, price: 500, inStock: 0 },
  { id: "g5", name: { fr: "Câble de chargeur", ar: "سلك شاحن", en: "Charger cable" }, price: 15000, inStock: 20 },
  { id: "g6", name: { fr: "Livraison", ar: "توصيل", en: "Delivery" }, price: 20000, inStock: 0 },
];

const byPack: Record<Pack, SampleProduct[]> = {
  pharmacy,
  shop,
  bakery,
  restaurant,
  warehouse,
  hotel,
  transport,
  general,
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
    return { number, total: busy ? 25000 + (number % 7) * 10000 : null };
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
    { id: "o1", customer: "Fatimetou", items: words.one, dueAt: words.at, deposit: 50000 },
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
