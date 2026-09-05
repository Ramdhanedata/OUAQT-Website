import type { Metadata } from "next";
import { Source_Serif_4, Cairo } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PageTransition } from "@/components/motion/page-transition";
import { getDictionary } from "@/lib/i18n";
import { isRtl, locales, type Locale } from "@/lib/i18n/config";
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
    metadataBase: new URL("https://ouaqt.com"),
    alternates: {
      canonical: `/${lang}`,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])),
    },
    openGraph: {
      title: dict.meta.siteTitle,
      description: dict.meta.siteDescription,
      url: `https://ouaqt.com/${lang}`,
      siteName: "OUAQT",
      locale: lang,
      type: "website",
    },
  };
}

export default function RootLayout({ children, params }: Props) {
  if (!locales.includes(params.lang as Locale)) notFound();

  const lang = params.lang as Locale;
  const dict = getDictionary(lang);
  const rtl = isRtl(lang);

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
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Navbar dict={dict} lang={lang} />
          <main className="min-h-screen pt-16 sm:pt-20">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer dict={dict} lang={lang} />
        </ThemeProvider>
      </body>
    </html>
  );
}
