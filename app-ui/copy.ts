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
