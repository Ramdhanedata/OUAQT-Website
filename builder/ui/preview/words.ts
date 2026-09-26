import type { AppLanguage } from "@/app-ui";

/*
 * The app's own names for its sections, for the line under the builder's
 * preview that says which screen an answer just changed. They are the
 * desktop app's labels (src/i18n there), word for word.
 */

export const fr = {
  shopPlaceholder: "Votre commerce",
  nav: {
    sale: "Vente",
    counter: "Commandes",
    overview: "Tableau de bord",
    dashboard: "Accueil",
    menu: "Carte",
    production: "Production",
    preorders: "Commandes",
    moves: "Mouvements",
    rooms: "Chambres",
    stays: "Réservations",
    extras: "Extras",
    trips: "Départs",
    parcels: "Colis",
    network: "Lignes",
    stock: "Stock",
    expenses: "Dépenses",
    customers: "Clients",
    cash: "Caisse",
    reports: "Rapports",
    settings: "Réglages",
  },
} as const;

type Shape<T> = { readonly [K in keyof T]: T[K] extends string ? string : Shape<T[K]> };
export type Words = Shape<typeof fr>;

export const ar: Words = {
  shopPlaceholder: "متجرك",
  nav: {
    sale: "بيع",
    counter: "الطلبات",
    overview: "لوحة القيادة",
    dashboard: "الرئيسية",
    menu: "القائمة",
    production: "الإنتاج",
    preorders: "الطلبيات",
    moves: "الحركات",
    rooms: "الغرف",
    stays: "الحجوزات",
    extras: "الإضافات",
    trips: "الرحلات",
    parcels: "الطرود",
    network: "الخطوط",
    stock: "المخزون",
    expenses: "المصاريف",
    customers: "الزبائن",
    cash: "الصندوق",
    reports: "التقارير",
    settings: "الإعدادات",
  },
};

export const en: Words = {
  shopPlaceholder: "Your business",
  nav: {
    sale: "Sell",
    counter: "Orders",
    overview: "Dashboard",
    dashboard: "Home",
    menu: "Menu",
    production: "Production",
    preorders: "Orders",
    moves: "Movements",
    rooms: "Rooms",
    stays: "Bookings",
    extras: "Extras",
    trips: "Departures",
    parcels: "Parcels",
    network: "Routes",
    stock: "Stock",
    expenses: "Expenses",
    customers: "Customers",
    cash: "Till",
    reports: "Reports",
    settings: "Settings",
  },
};

const all: Record<AppLanguage, Words> = { fr, ar, en };

export function wordsFor(language: AppLanguage): Words {
  return all[language] ?? fr;
}
