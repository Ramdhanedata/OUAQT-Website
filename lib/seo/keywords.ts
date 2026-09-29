import type { Locale } from "@/lib/i18n/config";

/*
 * What an owner in Mauritania types into a search bar, per language.
 *
 * Written into the page as <meta name="keywords">, and kept here as the list
 * the titles and descriptions in the dictionaries are written against. When a
 * new trade opens, its words go here and into its page title.
 */
export const seoKeywords: Record<Locale, readonly string[]> = {
  fr: [
    "OUAQT",
    "logiciel de gestion Mauritanie",
    "logiciel de caisse Mauritanie",
    "logiciel de gestion Nouakchott",
    "logiciel de caisse Nouakchott",
    "logiciel de gestion PME",
    "logiciel de gestion de stock",
    "logiciel de gestion commerciale",
    "logiciel de facturation",
    "logiciel de pharmacie Mauritanie",
    "logiciel de gestion pharmacie",
    "logiciel caisse restaurant",
    "logiciel caisse boutique",
    "logiciel gestion boulangerie",
    "logiciel gestion hôtel",
    "logiciel gestion transport",
    "caisse enregistreuse",
    "point de vente",
    "logiciel sans internet",
    "logiciel sur mesure Mauritanie",
    "Bankily",
    "Masrvi",
    "Sedad",
  ],
  en: [
    "OUAQT",
    "business management software Mauritania",
    "POS software Mauritania",
    "point of sale software Nouakchott",
    "small business software",
    "stock management software",
    "inventory software",
    "invoicing software",
    "pharmacy management software",
    "restaurant POS software",
    "shop POS software",
    "bakery management software",
    "hotel management software",
    "transport company software",
    "offline POS software",
    "custom software Mauritania",
  ],
  ar: [
    "وقت",
    "OUAQT",
    "برنامج تسيير موريتانيا",
    "برنامج محاسبة موريتانيا",
    "برنامج كاشير موريتانيا",
    "برنامج كاشير نواكشوط",
    "برنامج إدارة المخزون",
    "برنامج نقطة بيع",
    "برنامج صيدلية",
    "برنامج تسيير صيدلية",
    "برنامج كاشير مطعم",
    "برنامج محل تجاري",
    "برنامج مخبزة",
    "برنامج فندق",
    "برنامج شركة نقل",
    "برنامج بدون إنترنت",
    "برمجيات حسب الطلب موريتانيا",
  ],
};
