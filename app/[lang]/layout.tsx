import type { Metadata } from "next";
import { Source_Serif_4, Cairo } from "next/font/google";
import "../globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PageTransition } from "@/components/motion/page-transition";
import { getDictionary } from "@/lib/i18n";
import { isRtl, locales, type Locale } from "@/lib/i18n/config";
import { alternatesFor, siteUrl } from "@/lib/i18n/metadata";
import { organization } from "@/lib/data/contact";
import { founder } from "@/lib/data/founder";
import { notFound } from "next/navigation";

/*
 * Source Serif 4 stands in for the transitional serif on Anthropic's site
 * (Copernicus / Tiempos). Those are commercially licensed and cannot be
 * redistributed, so this is the closest freely licensed match: same
 * transitional structure, moderate contrast, and a full variable weight axis.
 *
 * TODO(adel): if you buy a licence for Tiempos or similar, swap this for
 * next/font/local and point it at the woff2 files. Nothing else changes.
 */
const serif = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  variable: "--font-serif",
  display: "swap",
});

/*
 * Arabic uses Cairo, a modern geometric Arabic sans, rather than a Naskh
 * serif. Pairing a Latin serif with an Arabic sans is deliberate: Naskh reads
 * as traditional and formal, while Cairo matches how contemporary brands in
 * the region actually set Arabic.
 *
 * TODO(adel): Tajawal and Almarai are near-identical alternatives. Changing
 * the import name here is the only edit needed to try one.
 */
const arabic = Cairo({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
  // Not preloaded: Arabic subsets are heavy and English and French visitors
  // never render a single glyph from this face. It loads on demand on /ar.
  preload: false,
});

type Props = {
  children: React.ReactNode;
  params: { lang: string };
};

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export function generateMetadata({ params }: Props): Metadata {
  const lang = params.lang as Locale;
  const dict = getDictionary(lang);

  return {
    title: dict.meta.siteTitle,
    description: dict.meta.siteDescription,
    metadataBase: new URL(siteUrl()),
    /*
     * Google Search Console ownership check. Set GOOGLE_SITE_VERIFICATION in
     * Vercel to the content value of the HTML tag Search Console gives you,
     * then redeploy. The value is public by design; it is not a secret.
     */
    verification: process.env.GOOGLE_SITE_VERIFICATION
      ? { google: process.env.GOOGLE_SITE_VERIFICATION }
      : undefined,
    alternates: alternatesFor(lang, "/"),
    /*
     * Link previews on WhatsApp, Facebook and X use a picture per language,
     * built by scripts/make-share-images.mjs from the dictionaries.
     */
    openGraph: {
      title: dict.meta.siteTitle,
      description: dict.meta.siteDescription,
      url: `${siteUrl()}/${lang}`,
      siteName: dict.common.brand,
      locale: lang,
      type: "website",
      images: [
        {
          url: `/og/${lang}.png`,
          width: 1200,
          height: 630,
          alt: dict.meta.shareAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.siteTitle,
      description: dict.meta.siteDescription,
      images: [`/og/${lang}.png`],
    },
  };
}

export default function RootLayout({ children, params }: Props) {
  if (!locales.includes(params.lang as Locale)) notFound();

  const lang = params.lang as Locale;
  const dict = getDictionary(lang);
  const rtl = isRtl(lang);

  /*
   * Structured data describing the business, so Google can show OUAQT in
   * local results ("logiciel pharmacie Nouakchott") with its city, phone and
   * languages. Only verified links go in sameAs.
   */
  const base = siteUrl();
  const businessData = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${base}/#business`,
    name: "OUAQT",
    alternateName: "وقت",
    url: `${base}/${lang}`,
    logo: `${base}/logo-ouaqt-dark-ink.png`,
    image: `${base}/og/${lang}.png`,
    description: dict.meta.siteDescription,
    email: organization.email,
    telephone: organization.whatsappUrl.replace("https://wa.me/", "+"),
    address: {
      "@type": "PostalAddress",
      addressLocality: "Nouakchott",
      addressCountry: "MR",
    },
    areaServed: { "@type": "Country", name: "Mauritania" },
    knowsLanguage: ["fr", "ar", "en"],
    founder: { "@type": "Person", name: founder.name },
    sameAs: [organization.linkedin],
  };

  return (
    <html
      lang={lang}
      dir={rtl ? "rtl" : "ltr"}
      suppressHydrationWarning
      /* The font variables must live on <html>, not <body>. CSS custom
         properties inherit downward only, so declaring them on <body> left
         var(--font-arabic) empty for any rule targeting <html> and Arabic
         silently fell back to the Latin serif. */
      className={`${serif.variable} ${arabic.variable}`}
    >
      <body
        className={`${rtl ? "font-arabic" : "font-serif"} antialiased`}
      >
        <script
          type="application/ld+json"
          // "<" escaped so the JSON can never close the script tag.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(businessData).replace(/</g, "\\u003c"),
          }}
        />
        <Navbar dict={dict} lang={lang} />
        <main className="min-h-screen pt-16 sm:pt-20">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer dict={dict} lang={lang} />
      </body>
    </html>
  );
}
