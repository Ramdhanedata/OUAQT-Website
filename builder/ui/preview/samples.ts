import type { AppLanguage, Pack } from "@/app-ui";

/*
 * What the preview's screens hold before the owner has imported anything.
 *
 * not-a-rule-file: every line here is invented sample data. The prices are
 * never charged to anyone, the names belong to nobody, and nothing comes from
 * a real shop, a real client or a screenshot of one (docs/UI_RULES.md).
 *
 * The pharmacy holds counter items only, never a medicine, a dosage or a
 * brand, so nothing on the preview can be read as advice about a medicine.
 * Amounts are in the smallest unit like everywhere else: 12000 is 120 MRU.
 */

type Named = Record<AppLanguage, string>;

export type SampleItem = {
  id: string;
  name: Named;
  price: number;
  /** Null for what is not counted: a dish, a night, a ticket. */
  stock: number | null;
  category?: Named;
  /** Months from today; negative is already past. Pharmacy only. */
  expiresInMonths?: number;
  batch?: string;
  supplier?: string;
  /** Sold by weight when the shop sells by weight at all. */
  weighed?: boolean;
  /** A dish with choices, when the restaurant takes them. */
  hasOptions?: boolean;
};

const c = (fr: string, ar: string, en: string): Named => ({ fr, ar, en });

const DRINKS = c("Boissons", "مشروبات", "Drinks");
const DISHES = c("Plats", "أطباق", "Dishes");
const SANDWICHES = c("Sandwichs", "سندويتشات", "Sandwiches");
const BREAD = c("Pains", "خبز", "Bread");
const PASTRY = c("Viennoiseries", "معجنات", "Pastries");
const CAKES = c("Gâteaux", "حلويات", "Cakes");

const items: Record<Pack, SampleItem[]> = {
  pharmacy: [
    { id: "p1", name: c("Savon antiseptique", "صابون مطهر", "Antiseptic soap"), price: 12000, stock: 24, expiresInMonths: 14, batch: "L2408", supplier: "Sud Distribution" },
    { id: "p2", name: c("Pansements, boîte", "لصقات، علبة", "Plasters, box"), price: 25000, stock: 4, expiresInMonths: 5, batch: "L2391", supplier: "Sud Distribution" },
    { id: "p3", name: c("Gants, boîte de 50", "قفازات، علبة 50", "Gloves, box of 50"), price: 40000, stock: 8, expiresInMonths: 22, batch: "L2502", supplier: "Atlantique Santé" },
    { id: "p4", name: c("Thermomètre", "ميزان حرارة", "Thermometer"), price: 90000, stock: 3, supplier: "Atlantique Santé" },
    { id: "p5", name: c("Coton hydrophile", "قطن طبي", "Cotton wool"), price: 15000, stock: 30, expiresInMonths: 2, batch: "L2317", supplier: "Sud Distribution" },
    { id: "p6", name: c("Masques, paquet", "كمامات، علبة", "Masks, pack"), price: 20000, stock: 40, expiresInMonths: 30, batch: "L2520", supplier: "Atlantique Santé" },
    { id: "p7", name: c("Gel hydroalcoolique", "جل معقم", "Hand gel"), price: 18000, stock: 16, expiresInMonths: 8, batch: "L2440", supplier: "Sud Distribution" },
    { id: "p8", name: c("Lingettes bébé", "مناديل أطفال", "Baby wipes"), price: 14000, stock: 12, expiresInMonths: 11, batch: "L2433", supplier: "Atlantique Santé" },
  ],
  shop: [
    { id: "s1", name: c("Lait en poudre", "حليب مجفف", "Powdered milk"), price: 18000, stock: 24 },
    { id: "s2", name: c("Sucre", "سكر", "Sugar"), price: 4500, stock: 50, weighed: true },
    { id: "s3", name: c("Huile, 1 litre", "زيت، 1 لتر", "Oil, 1 litre"), price: 9000, stock: 36 },
    { id: "s4", name: c("Thé vert, paquet", "شاي أخضر، علبة", "Green tea, pack"), price: 12000, stock: 4 },
    { id: "s5", name: c("Riz", "أرز", "Rice"), price: 4000, stock: 80, weighed: true },
    { id: "s6", name: c("Savon", "صابون", "Soap"), price: 3000, stock: 60 },
    { id: "s7", name: c("Recharge téléphone", "تعبئة رصيد", "Phone top-up"), price: 10000, stock: 100 },
    { id: "s8", name: c("Eau, pack de 6", "ماء، 6 قارورات", "Water, pack of 6"), price: 15000, stock: 3 },
  ],
  bakery: [
    { id: "b1", name: c("Pain", "خبز", "Bread"), price: 2000, stock: 180, category: BREAD, weighed: true },
    { id: "b2", name: c("Baguette", "باغيت", "Baguette"), price: 2500, stock: 120, category: BREAD },
    { id: "b3", name: c("Pain complet", "خبز أسمر", "Wholemeal bread"), price: 4000, stock: 30, category: BREAD, weighed: true },
    { id: "b4", name: c("Croissant", "كرواسون", "Croissant"), price: 5000, stock: 48, category: PASTRY },
    { id: "b5", name: c("Pain au chocolat", "خبز بالشوكولا", "Chocolate bread"), price: 6000, stock: 36, category: PASTRY },
    { id: "b6", name: c("Gâteau, part", "قطعة كعك", "Cake, slice"), price: 15000, stock: 4, category: CAKES },
    { id: "b7", name: c("Tarte aux fruits", "تارت بالفواكه", "Fruit tart"), price: 60000, stock: 6, category: CAKES },
    { id: "b8", name: c("Gâteau d'anniversaire", "كعكة عيد ميلاد", "Birthday cake"), price: 150000, stock: 2, category: CAKES },
  ],
  restaurant: [
    { id: "r1", name: c("Thé à la menthe", "شاي بالنعناع", "Mint tea"), price: 5000, stock: null, category: DRINKS },
    { id: "r2", name: c("Café", "قهوة", "Coffee"), price: 8000, stock: null, category: DRINKS },
    { id: "r3", name: c("Jus d'orange", "عصير برتقال", "Orange juice"), price: 12000, stock: null, category: DRINKS },
    { id: "r4", name: c("Poulet grillé", "دجاج مشوي", "Grilled chicken"), price: 70000, stock: null, category: DISHES, hasOptions: true },
    { id: "r5", name: c("Riz au poisson", "أرز بالسمك", "Rice with fish"), price: 60000, stock: null, category: DISHES, hasOptions: true },
    { id: "r6", name: c("Brochettes", "مشاوي", "Skewers"), price: 55000, stock: null, category: DISHES, hasOptions: true },
    { id: "r7", name: c("Sandwich viande", "سندويتش لحم", "Meat sandwich"), price: 25000, stock: null, category: SANDWICHES, hasOptions: true },
    { id: "r8", name: c("Sandwich thon", "سندويتش تونة", "Tuna sandwich"), price: 20000, stock: null, category: SANDWICHES, hasOptions: true },
  ],
  warehouse: [
    { id: "w1", name: c("Riz, sac de 50 kg", "أرز، كيس 50 كغ", "Rice, 50 kg bag"), price: 1200000, stock: 60 },
    { id: "w2", name: c("Huile, carton", "زيت، كرتون", "Oil, case"), price: 900000, stock: 45 },
    { id: "w3", name: c("Sucre, sac de 25 kg", "سكر، كيس 25 كغ", "Sugar, 25 kg bag"), price: 750000, stock: 80 },
    { id: "w4", name: c("Lait, carton", "حليب، كرتون", "Milk, case"), price: 650000, stock: 4 },
    { id: "w5", name: c("Farine, sac de 50 kg", "دقيق، كيس 50 كغ", "Flour, 50 kg bag"), price: 1100000, stock: 25 },
    { id: "w6", name: c("Savon, carton", "صابون، كرتون", "Soap, case"), price: 480000, stock: 52 },
  ],
  hotel: [
    { id: "h1", name: c("Petit-déjeuner", "فطور", "Breakfast"), price: 25000, stock: null },
    { id: "h2", name: c("Dîner", "عشاء", "Dinner"), price: 60000, stock: null },
    { id: "h3", name: c("Blanchisserie", "غسيل", "Laundry"), price: 20000, stock: null },
    { id: "h4", name: c("Eau minérale", "ماء معدني", "Mineral water"), price: 5000, stock: null },
    { id: "h5", name: c("Navette aéroport", "نقل إلى المطار", "Airport shuttle"), price: 80000, stock: null },
    { id: "h6", name: c("Lit en plus", "سرير إضافي", "Extra bed"), price: 50000, stock: null },
  ],
  transport: [
    { id: "t1", name: c("Nouakchott, Nouadhibou", "نواكشوط، نواذيبو", "Nouakchott, Nouadhibou"), price: 80000, stock: null },
    { id: "t2", name: c("Nouakchott, Rosso", "نواكشوط، روصو", "Nouakchott, Rosso"), price: 30000, stock: null },
    { id: "t3", name: c("Nouakchott, Kiffa", "نواكشوط، كيفه", "Nouakchott, Kiffa"), price: 70000, stock: null },
  ],
  general: [
    { id: "g1", name: c("Coupe de cheveux", "قص الشعر", "Haircut"), price: 30000, stock: null },
    { id: "g2", name: c("Réparation", "إصلاح", "Repair"), price: 50000, stock: null },
    { id: "g3", name: c("Livraison", "توصيل", "Delivery"), price: 20000, stock: null },
    { id: "g4", name: c("Photocopie", "نسخة", "Photocopy"), price: 500, stock: null },
    { id: "g5", name: c("Shampooing", "شامبو", "Shampoo"), price: 25000, stock: 12 },
    { id: "g6", name: c("Câble de chargeur", "سلك شاحن", "Charger cable"), price: 15000, stock: 3 },
    { id: "g7", name: c("Coque de téléphone", "غلاف هاتف", "Phone case"), price: 20000, stock: 9 },
  ],
};

export function sampleItems(pack: Pack): SampleItem[] {
  return items[pack];
}

/** A shop's own stock alert: at this many or fewer, the product is flagged. */
export const LOW_STOCK_AT = 5;

export const sampleCustomers = [
  { id: "c1", name: "Mariem", owes: 120000, limit: 500000 },
  { id: "c2", name: "Sidi Mohamed", owes: 0, limit: 300000 },
  { id: "c3", name: "Khadijetou", owes: 350000, limit: 400000 },
];

export const sampleCashier = "Aïcha";

export const OPENING_CASH = 200000;

/* Takings on the six days before today, so the week is never an empty chart. */
export const pastWeek = [412000, 538000, 297000, 641000, 505000, 720000];

export function samplePreorders(language: AppLanguage) {
  const words = {
    fr: ["2 gâteaux d'anniversaire", "40 baguettes", "Tarte aux fruits"],
    ar: ["كعكتا عيد ميلاد", "40 باغيت", "تارت بالفواكه"],
    en: ["2 birthday cakes", "40 baguettes", "Fruit tart"],
  }[language];
  return [
    { id: "o1", customer: "Fatimetou", order: words[0], dueToday: true, at: "11:00", deposit: 100000 },
    { id: "o2", customer: "Mohamed", order: words[1], dueToday: true, at: "17:30", deposit: null },
    { id: "o3", customer: "Aminetou", order: words[2], dueToday: false, at: "09:00", deposit: 30000 },
  ];
}

export function sampleProduction() {
  return [
    { id: "b1", made: 220, sold: 164 },
    { id: "b2", made: 160, sold: 131 },
    { id: "b4", made: 60, sold: 41 },
    { id: "b5", made: 48, sold: 30 },
  ];
}

export function sampleMoves() {
  return [
    { id: "m1", direction: "in" as const, item: "w1", quantity: 40, unitIndex: 0, party: "supplier" as const, at: "08:15" },
    { id: "m2", direction: "out" as const, item: "w2", quantity: 12, unitIndex: 1, party: 0, at: "10:40" },
    { id: "m3", direction: "out" as const, item: "w3", quantity: 20, unitIndex: 0, party: 0, at: "11:05" },
  ];
}

export const sampleGuests = ["Ahmed Salem", "Mariem Cheikh", "Brahim Ould Ely", "Zeinabou", "Oumar Ba", "Lalla"];

export function sampleTrips() {
  return [
    { id: "d1", route: "t1", at: "07:30", seats: 15, sold: [1, 2, 3, 5, 6, 8, 9, 12, 14], parcels: 6 },
    { id: "d2", route: "t2", at: "09:00", seats: 15, sold: [1, 4, 7, 10], parcels: 3 },
    { id: "d3", route: "t3", at: "14:00", seats: 15, sold: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13], parcels: 9 },
  ];
}

export const sampleParcels = [
  { id: "k1", number: 1042, route: "t1", sender: "Ahmed Salem", receiver: "Mariem Cheikh", paidAtStart: true },
  { id: "k2", number: 1043, route: "t3", sender: "Oumar Ba", receiver: "Zeinabou", paidAtStart: false },
];

export function sampleExpenses(language: AppLanguage) {
  const words = {
    fr: ["Loyer", "Électricité", "Transport de marchandise"],
    ar: ["الإيجار", "الكهرباء", "نقل البضائع"],
    en: ["Rent", "Electricity", "Goods transport"],
  }[language];
  return [
    { id: "e1", what: words[0], amount: 1500000, day: 1 },
    { id: "e2", what: words[1], amount: 280000, day: 6 },
    { id: "e3", what: words[2], amount: 90000, day: 12 },
  ];
}

/* One night in a sample room, and a sample parcel, for the hotel and transport screens. */
export const NIGHT_PRICE = 250000;
export const PARCEL_PRICE = 10000;

/* The sample discount the Remise button applies, as a percentage. */
export const DISCOUNT_PERCENT = 10;

/* What one press adds: a batch out of the oven, a delivery into the stock. */
export const BATCH_SIZE = 20;
export const DELIVERY_SIZE = 20;

/* How many departures a day each sample route has. */
export const DEPARTURES_A_DAY = [2, 1, 1];

/* The table already eating when a restaurant's preview opens. */
export const SAMPLE_TABLE = { number: 3, drinks: 2, seatedMinutes: 18 };
