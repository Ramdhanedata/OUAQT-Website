import type { AppLanguage } from "./config";

/*
 * The words on the screens the shop sees every day.
 *
 * French is written first and the other two follow from its meaning. Shop
 * words only: vente, caisse, stock, reçu. Nothing technical ever reaches this
 * file, by rule 8 in docs/UI_RULES.md.
 */

export const fr = {
  sale: {
    title: "Vente",
    search: "Chercher un produit",
    ticket: "Vente en cours",
    empty: "Touchez un produit pour commencer la vente.",
    inStock: "En stock",
    outOfStock: "Rupture",
    quantity: "Quantité",
    remove: "Retirer",
    total: "Total",
    charge: "Encaisser",
    manager: "Gérant",
  },
  tables: {
    title: "Les tables",
    table: "Table",
    zone: "Zone",
    free: "Libre",
    takeaway: "À emporter",
  },
  production: {
    title: "Production du jour",
    made: "Produit",
    sold: "Vendu",
    left: "Reste",
    preorders: "Commandes à l'avance",
    dueToday: "Pour aujourd'hui",
    deposit: "Avance",
    none: "Rien de noté aujourd'hui. Touchez un produit pour commencer.",
  },
  stockMoves: {
    title: "Entrées et sorties",
    location: "Lieu",
    allLocations: "Tous les lieux",
    in: "Entrée",
    out: "Sortie",
    from: "De",
    to: "Vers",
    onHand: "En stock",
    none: "Aucun mouvement aujourd'hui.",
  },
  receipt: {
    number: "Reçu n°",
    quantity: "Qté",
    unitPrice: "Prix",
    lineTotal: "Montant",
    total: "Total",
    thanks: "Merci de votre visite",
  },
} as const;

export type AppCopy = {
  readonly [K in keyof typeof fr]: {
    readonly [P in keyof (typeof fr)[K]]: string;
  };
};

// TODO(adel): every string below is waiting for your review.
export const ar: AppCopy = {
  sale: {
    title: "بيع",
    search: "ابحث عن منتج",
    ticket: "البيع الجاري",
    empty: "اضغط على منتج لبدء البيع.",
    inStock: "في المخزون",
    outOfStock: "نفد",
    quantity: "الكمية",
    remove: "حذف",
    total: "المجموع",
    charge: "تحصيل",
    manager: "المسؤول",
  },
  tables: {
    title: "الطاولات",
    table: "طاولة",
    zone: "منطقة",
    free: "فارغة",
    takeaway: "للأخذ",
  },
  production: {
    title: "إنتاج اليوم",
    made: "أُنتج",
    sold: "بيع",
    left: "الباقي",
    preorders: "الطلبات المسبقة",
    dueToday: "لليوم",
    deposit: "عربون",
    none: "لا شيء مسجل اليوم. اضغط على منتج للبدء.",
  },
  stockMoves: {
    title: "الإدخال والإخراج",
    location: "المكان",
    allLocations: "كل الأماكن",
    in: "إدخال",
    out: "إخراج",
    from: "من",
    to: "إلى",
    onHand: "في المخزون",
    none: "لا حركة اليوم.",
  },
  receipt: {
    number: "وصل رقم",
    quantity: "الكمية",
    unitPrice: "السعر",
    lineTotal: "المبلغ",
    total: "المجموع",
    thanks: "شكراً لزيارتكم",
  },
};

// TODO(adel): every string below is waiting for your review.
export const en: AppCopy = {
  sale: {
    title: "Sale",
    search: "Search for a product",
    ticket: "Current sale",
    empty: "Tap a product to start the sale.",
    inStock: "In stock",
    outOfStock: "Out of stock",
    quantity: "Quantity",
    remove: "Remove",
    total: "Total",
    charge: "Take payment",
    manager: "Manager",
  },
  tables: {
    title: "Tables",
    table: "Table",
    zone: "Zone",
    free: "Free",
    takeaway: "Takeaway",
  },
  production: {
    title: "Today's production",
    made: "Made",
    sold: "Sold",
    left: "Left",
    preorders: "Orders in advance",
    dueToday: "For today",
    deposit: "Deposit",
    none: "Nothing recorded today. Tap a product to start.",
  },
  stockMoves: {
    title: "Goods in and out",
    location: "Place",
    allLocations: "All places",
    in: "In",
    out: "Out",
    from: "From",
    to: "To",
    onHand: "In stock",
    none: "No movements today.",
  },
  receipt: {
    number: "Receipt no.",
    quantity: "Qty",
    unitPrice: "Price",
    lineTotal: "Amount",
    total: "Total",
    thanks: "Thank you for your visit",
  },
};

const all: Record<AppLanguage, AppCopy> = { fr, ar, en };

export function getAppCopy(language: AppLanguage): AppCopy {
  return all[language] ?? fr;
}
